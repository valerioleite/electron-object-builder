import '@testing-library/jest-dom/vitest'

// Initialize i18n so that useTranslation() works in component tests
import '../i18n'

// Polyfill ResizeObserver for jsdom (used by ThingListPanel virtual scroll)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}
