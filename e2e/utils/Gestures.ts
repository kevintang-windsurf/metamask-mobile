/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, jsdoc/check-indentation */
import { waitFor, expect } from 'detox';
import Utilities from './Utilities';

interface GestureOptions {
  timeout?: number;
  delayBeforeTap?: number;
  skipVisibilityCheck?: boolean;
  experimentalWaitForStability?: boolean;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Class for handling user actions (Gestures)
 */
class Gestures {
  /**
   * Helper function to add delay before performing an action.
   * Useful when elements are visible but not fully interactive yet.
   *
   * @param delayMs - Delay in milliseconds
   */
  static async delayBeforeAction(delayMs: number): Promise<void> {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  /**
   * Tap an element and long press.
   *
   * @param element - The element to tap
   * @param timeout - Timeout for waiting (default: 2000ms)
   */
  static async tapAndLongPress(
    element: Promise<Detox.IndexableNativeElement>,
    timeout: number = 2000,
  ): Promise<void> {
    await (await element).longPress(timeout);
  }

  /**
   * Tap an element at a specific point.
   *
   * @param element - The element to tap
   * @param point - Coordinates { x, y } where the element will be tapped
   */
  static async tapAtPoint(
    element: Promise<Detox.IndexableNativeElement>,
    point: Point,
  ): Promise<void> {
    await (await element).tap(point);
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param element - The element to tap
   */
  static async tap(
    element: Promise<Detox.IndexableNativeElement>,
  ): Promise<void> {
    await (await element).tap();
  }

  /**
   * Tap an element with text partial text matching before tapping it
   *
   * @param textPattern - Regular expression pattern to match the text
   */
  static async tapTextBeginingWith(textPattern: string): Promise<void> {
    await element(by.text(new RegExp(`^/${textPattern} .*$/`))).tap();
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param element - The element to tap
   * @param options - Configuration options
   */
  static async waitAndTap(
    element: Promise<Detox.IndexableNativeElement | Detox.SystemElement>,
    options: GestureOptions = {},
  ): Promise<void> {
    const {
      timeout = 15000,
      delayBeforeTap = 0,
      skipVisibilityCheck = false,
    } = options;
    const elementToTap = await element;
    if (!skipVisibilityCheck) {
      await (device.getPlatform() === 'ios'
        ? waitFor(elementToTap).toExist()
        : waitFor(elementToTap).toBeVisible()
      ).withTimeout(timeout);
    }
    await this.delayBeforeAction(delayBeforeTap); // in some cases the element is visible but not fully interactive yet.
    await Utilities.waitForElementToBeEnabled(elementToTap);
    await (await elementToTap).tap();
  }

  /**
   * Wait for an element at a specific index to be visible and then tap it.
   *
   * @param element - The element to tap
   * @param index - Index of the element to tap
   * @param timeout - Timeout for waiting (default: 15000ms)
   */
  static async tapAtIndex(
    element: Promise<Detox.IndexableNativeElement>,
    index: number,
    timeout: number = 15000,
  ): Promise<void> {
    const itemElementAtIndex = (await element).atIndex(index);
    await waitFor(itemElementAtIndex).toBeVisible().withTimeout(timeout);
    await itemElementAtIndex.tap();
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param element - The element to tap
   * @param options - Options for the tap operation
   */
  static async tapWebElement(
    element: Promise<Detox.IndexableWebElement>,
    options: GestureOptions = {},
  ): Promise<void> {
    const { timeout = 15000, delayBeforeTap = 0 } = options;

    // For web elements, we need to use a different approach to wait
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await expect(await element).toExist();

        // Add delay before tap if specified
        await this.delayBeforeAction(delayBeforeTap);

        await (await element).tap();
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Web element not found or not tappable');
  }

  /**
   * Type text into a web element within a webview using JavaScript injection.
   * @param element - The web element to type into.
   * @param text - The text to type.
   */
  static async typeInWebElement(
    element: Promise<Detox.IndexableWebElement>,
    text: string,
  ): Promise<void> {
    try {
      await (
        await element
      ).runScript(
        (el, value) => {
          el.focus();
          el.value = value;
          el._valueTracker?.setValue('');
          el.dispatchEvent(new Event('input', { bubbles: true }));
        },
        [text],
      );
    } catch {
      await (await element).typeText(text);
    }
  }

  /**
   * Double tap an element by text.
   *
   * @param element - The element to double tap
   */
  static async doubleTap(
    element: Promise<Detox.IndexableNativeElement>,
  ): Promise<void> {
    await (await element).multiTap(2);
  }

  /**
   * Clear the text field of an element identified by ID.
   *
   * @param element - The element to clear
   * @param timeout - Timeout for waiting (default: 2500ms)
   */
  static async clearField(
    element: Promise<Detox.IndexableNativeElement>,
    timeout: number = 2500,
  ): Promise<void> {
    await waitFor(await element)
      .toBeVisible()
      .withTimeout(timeout);

    await (await element).replaceText('');
  }

  /**
   * Type text into an element and hide the keyboard.
   *
   * @param element - The element to type into
   * @param text - Text to be typed into the element
   */
  static async typeTextAndHideKeyboard(
    element: Promise<
      | Detox.IndexableNativeElement
      | Detox.NativeElement
      | Detox.IndexableSystemElement
    >,
    text: string,
  ): Promise<void> {
    await this.clearField(element);

    await (await element).typeText(text + '\n');
  }

  /**
   * Type text into an element without hiding the keyboard.
   *
   * @param element - The element to type into
   * @param text - Text to be typed into the element
   */
  static async typeTextWithoutKeyboard(
    element: Promise<Detox.IndexableNativeElement>,
    text: string,
  ): Promise<void> {
    await (await element).typeText(text);
  }

  /**
   * Replace the text in the field of an element identified by ID.
   *
   * @param element - The element to replace the text in
   * @param text - Text to replace the existing text in the element
   * @param timeout - Timeout for waiting (default: 10000ms)
   */
  static async replaceTextInField(
    element: Promise<Detox.IndexableNativeElement>,
    text: string,
    timeout: number = 10000,
  ): Promise<void> {
    await waitFor(await element)
      .toBeVisible()
      .withTimeout(timeout);

    await (await element).replaceText(text);
  }

  /**
   * Swipe on an element identified by ID.
   *
   * @param element - The element to swipe on
   * @param direction - Direction of the swipe - left | right | top | bottom | up | down
   * @param speed - Speed of the swipe (fast, slow)
   * @param percentage - Percentage of the swipe (0 to 1)
   * @param xStart - X-coordinate to start the swipe
   * @param yStart - Y-coordinate to start the swipe
   */
  static async swipe(
    element: Promise<Detox.IndexableNativeElement>,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
  ): Promise<void> {
    await (await element).swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Swipe on an element identified by ID.
   *
   * @param element - The element to swipe on
   * @param direction - Direction of the swipe - left | right | top | bottom | up | down
   * @param speed - Speed of the swipe (fast, slow)
   * @param percentage - Percentage of the swipe (0 to 1)
   * @param xStart - X-coordinate to start the swipe
   * @param yStart - Y-coordinate to start the swipe
   * @param index - Index of the element (default 0)
   */
  static async swipeAtIndex(
    element: Promise<Detox.IndexableNativeElement>,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
    index: number = 0,
  ): Promise<void> {
    await (await element)
      .atIndex(index)
      .swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Scrolls the web element until its top is at the top of the viewport.
   * @param element - The element to scroll to the viewport.
   */
  static async scrollToWebViewPort(
    element: Promise<Detox.IndexableWebElement>,
  ): Promise<void> {
    await (await element).scrollToView();
  }

  /**
   * Dynamically Scrolls to an element identified by ID.
   *
   * @param destinationElement - The element to scroll up to
   * @param scrollIdentifier - The identifier (by.id) NOT element (element(by.id)). Keep this distinction in mind. If you pass in an elementID this method would not work as intended
   * @param direction - Direction of the scroll (up, down, left, right). The default is down.
   * @param scrollAmount - The amount to scroll (default is 350). Optional parameter.
   */
  static async scrollToElement(
    destinationElement: Promise<Detox.IndexableNativeElement>,
    scrollIdentifier: Promise<Detox.NativeMatcher>,
    direction: Detox.Direction = 'down',
    scrollAmount: number = 350,
  ): Promise<void> {
    await waitFor(await destinationElement)
      .toBeVisible()
      .whileElement(await scrollIdentifier)
      .scroll(scrollAmount, direction);
  }
}

export default Gestures;
