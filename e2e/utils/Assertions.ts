/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, jsdoc/check-indentation */
import { waitFor, element, by } from 'detox';
import { Buffer } from 'buffer/';
import Matchers from './Matchers';

// Global timeout variable
const TIMEOUT = 15000;

/**
 * Class representing a set of assertions for Detox testing.
 */
class Assertions {
  /**
   * Check if an element with the specified ID is visible.
   * @param element - The element to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfVisible(
    element: Promise<
      | Detox.IndexableNativeElement
      | Detox.IndexableSystemElement
      | Detox.NativeElement
    >,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return device.getPlatform() === 'ios'
      ? await waitFor((await element) as any)
          .toExist()
          .withTimeout(timeout)
      : await waitFor((await element) as any)
          .toBeVisible()
          .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified web selector exists.
   * @param element - The element to check.
   */
  static async webViewElementExists(
    element: Promise<
      | Detox.IndexableNativeElement
      | Detox.IndexableSystemElement
      | Detox.NativeElement
    >,
  ): Promise<void> {
    // rename this. We are checking if element is visible.
    return await (expect as any)((await element) as any).toExist();
  }

  /**
   * Check if an element with the specified ID is not visible.
   * @param element - The element to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfNotVisible(
    element: Promise<
      | Detox.IndexableNativeElement
      | Detox.IndexableSystemElement
      | Detox.NativeElement
    >,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return await waitFor((await element) as any)
      .not.toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified text.
   * @param element - The element to check.
   * @param text - The text content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementToHaveText(
    element: Promise<
      | Detox.IndexableNativeElement
      | Detox.IndexableSystemElement
      | Detox.NativeElement
    >,
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    // Rename me. The naming convention here is terrible.

    return await waitFor((await element) as any)
      .toHaveText(text)
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified label.
   * @param element - The element to check.
   * @param label - The label content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementHasLabel(
    element: Promise<Detox.IndexableNativeElement>,
    label: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return await waitFor(await element)
      .toHaveLabel(label)
      .withTimeout(timeout);
  }

  /**
   * Check if text is visible.
   * @param text - The text to check if displayed.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfTextIsDisplayed(
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    const element = Matchers.getElementByText(text);
    return this.checkIfVisible(element, timeout);
  }

  /**
   * Check if text is not visible.
   * @param text - The text to check if not displayed.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfTextIsNotDisplayed(
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    const element = Matchers.getElementByText(text);
    return this.checkIfNotVisible(element, timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified text.
   * @param element - The element to check.
   * @param text - The text content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementNotToHaveText(
    element: Promise<Detox.IndexableNativeElement>,
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    // Rename me. The naming convention here is terrible.

    return await waitFor(await element)
      .not.toHaveText(text)
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified label.
   * @param element - The element to check.
   * @param label - The label content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementDoesNotHaveLabel(
    element: Promise<Detox.IndexableNativeElement>,
    label: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    // Rename me. The naming convention here is terrible.

    return await waitFor(await element)
      .not.toHaveLabel(label)
      .withTimeout(timeout);
  }

  /**
   * Check if the toggle with the specified ID is in the "on" state.
   * @param element - The toggle element.
   */
  static async checkIfToggleIsOn(
    element: Promise<Detox.IndexableNativeElement>,
  ): Promise<void> {
    return (expect as any)((await element) as any).toHaveToggleValue(true);
  }

  /**
   * Check if the toggle with the specified ID is in the "off" state.
   * @param element - The toggle element.
   */
  static async checkIfToggleIsOff(
    element: Promise<Detox.IndexableNativeElement>,
  ): Promise<void> {
    return (expect as any)((await element) as any).toHaveToggleValue(false);
  }

  /**
   * Check if two text values match exactly.
   * Automatically normalizes non-breaking spaces and other whitespace characters.
   * @param actualText - The actual text value to check.
   * @param expectedText - The expected text value to match against.
   */
  static async checkIfTextMatches(
    actualText: string,
    expectedText: string,
  ): Promise<void> {
    try {
      if (!actualText || !expectedText) {
        throw new Error('Both actual and expected text must be provided');
      }

      // Normalize non-breaking spaces to regular spaces for comparison
      const normalizedActual = actualText.replace(/\u00A0/g, ' ');
      const normalizedExpected = expectedText.replace(/\u00A0/g, ' ');

      return expect(normalizedActual).toBe(normalizedExpected);
    } catch (error) {
      // Check normalized versions for comparison
      const normalizedActual = actualText.replace(/\u00A0/g, ' ');
      const normalizedExpected = expectedText.replace(/\u00A0/g, ' ');

      if (normalizedActual !== normalizedExpected) {
        // Provide detailed debugging information
        const actualBytes = Buffer.from(actualText, 'utf8').toString('hex');
        const expectedBytes = Buffer.from(expectedText, 'utf8').toString('hex');
        throw new Error(
          `Text matching failed.\nExpected: "${expectedText}"\nActual: "${actualText}"\n` +
            `Expected (hex): ${expectedBytes}\nActual (hex): ${actualBytes}\n` +
            `Expected (normalized): "${normalizedExpected}"\nActual (normalized): "${normalizedActual}"`,
        );
      }
    }
  }

  /**
   * Check if two objects match exactly.
   * Note: This assertion does not test UI elements. It is intended for testing values such as events from the mock server or other non-UI data.
   * @param actualObject - The actual object to check.
   * @param expectedObject - The expected object to match against.
   */
  static async checkIfObjectsMatch(
    actualObject: unknown,
    expectedObject: unknown,
  ): Promise<void> {
    try {
      if (!actualObject || !expectedObject) {
        throw new Error('Both actual and expected objects must be provided');
      }

      return expect(actualObject).toEqual(expectedObject);
    } catch (error) {
      if (JSON.stringify(actualObject) !== JSON.stringify(expectedObject)) {
        throw new Error(
          `Object matching failed.\nExpected: ${JSON.stringify(
            expectedObject,
            null,
            2,
          )}\nActual: ${JSON.stringify(actualObject, null, 2)}`,
        );
      }
    }
  }

  /**
   * Check if an array has the expected length.
   * Note: This assertion does not test UI elements. It is intended for testing values such as events from the mock server or other non-UI data.
   * @param array - The array to check.
   * @param expectedLength - The expected length of the array.
   */
  static async checkIfArrayHasLength(
    array: unknown[],
    expectedLength: number,
  ): Promise<void> {
    try {
      if (!Array.isArray(array)) {
        throw new Error('The provided value is not an array');
      }

      if (typeof expectedLength !== 'number') {
        throw new Error('Expected length must be a number');
      }

      return expect(array.length).toBe(expectedLength);
    } catch (error) {
      if (array.length !== expectedLength) {
        throw new Error(
          `Array length assertion failed.\nExpected length: ${expectedLength}\nActual length: ${array.length}`,
        );
      }
    }
  }

  /**
   * Check if a value is defined (not null, not undefined, not an empty string).
   * Also evaluates a Boolean value.
   * Note: This assertion does not test UI elements. It is intended for testing values such as events from the mock server or other non-UI data.
   * @param value - The value to check.
   */
  static async checkIfValueIsDefined(value: unknown): Promise<void> {
    // 0 evaluates to false, so we need to handle it separately
    if (typeof value === 'number') {
      return;
    }

    if (!value) {
      throw new Error('Value is not present (falsy value)');
    }
  }

  /**
   * Checks if the actual object contains all key/value pairs from the partial object.
   * Throws an error if the assertion fails, listing all issues found.
   * @param actual - The object to check against
   * @param partial - The partial object with expected key/value pairs
   * @param deep - Whether to perform deep comparison for nested objects (default: true)
   */
  static async checkIfObjectContains(
    actual: Record<string, unknown>,
    partial: Record<string, unknown>,
    deep: boolean = true,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const errors: string[] = [];

      function check(actualObj: any, partialObj: any, path = '') {
        if (
          typeof actualObj !== 'object' ||
          typeof partialObj !== 'object' ||
          actualObj === null ||
          partialObj === null
        ) {
          if (actualObj !== partialObj) {
            errors.push(
              `Value mismatch at "${path || 'root'}": expected ${JSON.stringify(
                partialObj,
              )}, got ${JSON.stringify(actualObj)}`,
            );
          }
          return;
        }

        for (const key in partialObj) {
          const currentPath = path ? `${path}.${key}` : key;
          if (!Object.prototype.hasOwnProperty.call(actualObj, key)) {
            errors.push(`Missing key at "${currentPath}" in actual object`);
            continue;
          }

          if (
            deep &&
            typeof partialObj[key] === 'object' &&
            partialObj[key] !== null
          ) {
            check(actualObj[key], partialObj[key], currentPath);
          } else if (actualObj[key] !== partialObj[key]) {
            errors.push(
              `Value mismatch at "${currentPath}": expected ${JSON.stringify(
                partialObj[key],
              )}, got ${JSON.stringify(actualObj[key])}`,
            );
          }
        }
      }

      check(actual, partial);

      if (errors.length > 0) {
        reject(
          new Error('Object contains assertion failed:\n' + errors.join('\n')),
        );
      } else {
        resolve();
      }
    });
  }

  /**
   * Checks if the actual object contains all keys from the expected array
   * @param actual - The object to check against
   * @param validations - Object with keys and their expected values
   */
  static checkIfObjectHasKeysAndValidValues(
    actual: Record<string, unknown>,
    validations: Record<string, string | ((value: unknown) => boolean)>,
  ): void {
    const errors = [];

    for (const [key, validation] of Object.entries(validations)) {
      if (!Object.prototype.hasOwnProperty.call(actual, key)) {
        errors.push(`Missing key: ${key}`);
        continue;
      }

      const value = actual[key];

      if (typeof validation === 'string') {
        const actualType = typeof value;

        if (Array.isArray(value) && validation === 'array') continue;
        if (value === null && validation === 'null') continue;

        // Check type
        if (
          actualType !== validation &&
          !(Array.isArray(value) && validation === 'array')
        ) {
          errors.push(
            `Type mismatch for key "${key}": expected "${validation}", got "${actualType}"`,
          );
        }
      } else if (typeof validation === 'function') {
        try {
          const valid = validation(value);
          if (!valid) {
            errors.push(
              `Validation failed for key "${key}": custom validator returned false`,
            );
          }
        } catch (err: any) {
          errors.push(`Validation error for key "${key}": ${err.message}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error('Object validation failed:\n' + errors.join('\n'));
    }
  }

  /**
   * Check if element is enabled
   * @param element - The element to check
   * @return Resolves to true if the element is enabled, false otherwise
   */
  static async checkIfEnabled(
    element: Promise<Detox.IndexableNativeElement>,
  ): Promise<boolean> {
    return ((await (await element).getAttributes()) as any).enabled;
  }

  /**
   * Check if element is disabled
   * @param element - The element to check
   * @return Resolves to true if the element is disabled, false otherwise
   */
  static async checkIfDisabled(
    element: Promise<Detox.IndexableNativeElement>,
  ): Promise<boolean> {
    return ((await (await element).getAttributes()) as any).enabled;
  }

  /**
   * Check if label contains text
   * @param text - The text to check if the label contains
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfLabelContainsText(
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    const labelMatcher = element(by.label(new RegExp(text)));
    return await waitFor(labelMatcher).toExist().withTimeout(timeout);
  }
}

export default Assertions;
