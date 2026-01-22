import { vi } from "vitest";

// Mock ResizeObserver which is not available in jsdom
class ResizeObserverMock {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(_target: Element) {
    // Immediately call callback with empty entries to simulate initial observation
    // In real tests, you can trigger resize by calling the callback manually
  }

  unobserve(_target: Element) {}

  disconnect() {}
}

// @ts-expect-error - Mock ResizeObserver for jsdom environment
globalThis.ResizeObserver = ResizeObserverMock;
