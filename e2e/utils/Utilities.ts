/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, jsdoc/check-indentation */
import { blacklistURLs } from '../resources/blacklistURLs.json';
// eslint-disable-next-line import/no-nodejs-modules
import { setTimeout as asyncSetTimeout } from 'node:timers/promises';

interface WaitForStabilityOptions {
  timeout?: number;
  interval?: number;
  stableCount?: number;
}

interface WaitUntilOptions {
  interval: number;
  timeout: number;
}

export default class Utilities {
  /**
   * Formats an array of strings into a regex pattern string for exact matching.
   * This method takes an array of strings and returns a string formatted
   * for use in a regex pattern, designed to match any one of the provided strings exactly.
   * The resulting string is suitable for inclusion in a larger regex pattern.
   *
   * @param regexstrings - An array of strings to be formatted for exact matching in a regex pattern.
   * @returns A string formatted for exact matching within a regex pattern,
   *                    encapsulating the input strings in a way that they can be matched as literals.
   * @example
   * // returns '\\("apple","banana","cherry"\\)'
   * formatForExactMatchGroup(['apple', 'banana', 'cherry']);
   */
  static formatForExactMatchGroup(regexstrings: string[]): string {
    return `\\("${regexstrings.join('","')}"\\)`;
  }

  /**
   * A getter method that returns a formatted string of blacklisted URLs for exact matching in a regex pattern.
   * This method leverages `formatForExactMatchGroup` to format the `blacklistURLs` array into a regex pattern string,
   * suitable for matching any one of the blacklisted URLs exactly. The `blacklistURLs` should be defined
   * within the class or accessible in the class context.
   *
   * @returns A regex pattern string formatted for exact matching of blacklisted URLs.
   * @example
   */
  static get BlacklistURLs(): string {
    return this.formatForExactMatchGroup(blacklistURLs);
  }

  static async waitForElementToBeEnabled(
    element: Promise<Detox.IndexableNativeElement>,
    timeout: number = 3500,
    interval: number = 100,
  ): Promise<void> {
    const startTime = Date.now();
    let isEnabled = false;
    while (Date.now() - startTime < timeout) {
      isEnabled = ((await (await element).getAttributes()) as any).enabled;
      if (isEnabled) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    if (!isEnabled) {
      throw new Error('Element is not enabled');
    }
  }

  /**
   * Waits for an element to become stable (not moving) by checking its position multiple times.
   *
   * @param element - The element to check for stability
   * @param options - Configuration options
   */
  static async waitForElementToStopMoving(
    element: Promise<Detox.IndexableNativeElement>,
    options: WaitForStabilityOptions = {},
  ): Promise<void> {
    const { timeout = 5000, interval = 200, stableCount = 3 } = options;
    let lastPosition = null;
    let stableChecks = 0;
    const fallBackTimeout = 2000;
    const start = Date.now();

    const getPosition = async (
      element: Detox.IndexableNativeElement,
    ): Promise<{ x: number; y: number } | null> => {
      try {
        const attributes = (await element.getAttributes()) as any;
        if (
          attributes.frame &&
          typeof attributes.frame.x === 'number' &&
          typeof attributes.frame.y === 'number'
        ) {
          return { x: attributes.frame.x, y: attributes.frame.y };
        }
        return null;
      } catch {
        return null;
      }
    };

    while (Date.now() - start < timeout) {
      const el = await element;

      const position = await getPosition(el);

      if (!position) {
        await new Promise((resolve) => setTimeout(resolve, fallBackTimeout));
        return; // Return early if position is not available
      }

      if (
        lastPosition &&
        position.x === lastPosition.x &&
        position.y === lastPosition.y
      ) {
        stableChecks += 1;
        if (stableChecks >= stableCount) return;
      } else {
        lastPosition = position;
        stableChecks = 1;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Element did not become stable in time');
  }

  /**
   * Waits for a condition to be met within a given timeout period.
   *
   * Note: Copied directly from the extension implementation
   *
   * @param condition - The condition to wait for. This function must return a boolean indicating whether the condition is met.
   * @param options - Options for the wait.
   * @returns A promise that resolves when the condition is met or the timeout is reached.
   * @throws Throws an error if the condition is not met within the timeout period.
   */
  static async waitUntil(
    condition: () => Promise<boolean>,
    { interval, timeout }: WaitUntilOptions,
  ): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + timeout;

    // Loop indefinitely until condition met or timeout
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await condition();
      if (result === true) {
        return; // Condition met
      }

      const currentTime = Date.now();
      if (currentTime >= endTime) {
        throw new Error(`Condition not met within ${timeout}ms.`);
      }

      // Calculate remaining time to ensure we don't overshoot the timeout
      const remainingTime = endTime - currentTime;
      const waitTime = Math.min(interval, remainingTime);

      // always yield to the event loop, even for an interval of `0`, to avoid a
      // macro-task deadlock
      await asyncSetTimeout(waitTime, null, { ref: false });
    }
  }
}
