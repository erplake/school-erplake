import '@testing-library/jest-dom';

// Mock clipboard & scroll behaviors for jsdom
Object.assign(navigator, {
  clipboard: {
    writeText: () => Promise.resolve()
  }
});

// Polyfill ResizeObserver (used by recharts ResponsiveContainer) for jsdom
if (typeof global.ResizeObserver === 'undefined') {
  class ResizeObserver {
    constructor(cb) { this.cb = cb; }
    observe(target) {
      // Immediately invoke callback with a minimal contentRect
      this.cb([{ target, contentRect: target.getBoundingClientRect ? target.getBoundingClientRect() : { width: 800, height: 600 } }]);
    }
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;
}
