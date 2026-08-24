import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, vi } from "vitest"
import { server } from "@/mocks/server"
import { resetNavigationMock } from "./mocks/next-navigation"
import { resetAllStores } from "./store-reset"

/* ------------------------------------------------------------------ *
 * Module mocks
 *
 * `vi.mock` calls are hoisted above every import in this file, so their factories must not
 * reference module-scope bindings. Each factory is therefore `async` and pulls its
 * implementation in with a dynamic `import()`, which runs at mock-resolution time (well after
 * hoisting) and keeps the mock bodies in their own reviewable files.
 * ------------------------------------------------------------------ */

vi.mock("motion/react", async () => {
  const { motionMock } = await import("./mocks/motion")
  return motionMock()
})

vi.mock("lenis", async () => {
  const { lenisMock } = await import("./mocks/motion")
  return lenisMock()
})

vi.mock("lenis/react", async () => {
  const { lenisMock } = await import("./mocks/motion")
  const { default: Lenis } = lenisMock()
  return {
    __esModule: true,
    default: Lenis,
    ReactLenis: ({ children }: { children?: unknown }) => children,
    useLenis: () => null,
  }
})

vi.mock("next/image", async () => {
  const { nextImageMock } = await import("./mocks/next-image")
  return nextImageMock()
})

vi.mock("next/link", async () => {
  const { nextLinkMock } = await import("./mocks/next-image")
  return nextLinkMock()
})

vi.mock("next/navigation", async () => {
  const { nextNavigationMock } = await import("./mocks/next-navigation")
  return nextNavigationMock()
})

vi.mock("sonner", async () => {
  const toast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
    loading: vi.fn(),
    custom: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  })
  return { toast, Toaster: () => null }
})

/* ------------------------------------------------------------------ *
 * jsdom polyfills
 * Radix (matchMedia), react-intersection-observer (IntersectionObserver),
 * charts/resizable panels (ResizeObserver) and lenis (scrollTo) all need these.
 * ------------------------------------------------------------------ */

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

class MockObserver {
  readonly root = null
  readonly rootMargin = ""
  readonly thresholds: ReadonlyArray<number> = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

vi.stubGlobal("IntersectionObserver", MockObserver)
vi.stubGlobal("ResizeObserver", MockObserver)

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
Element.prototype.scrollIntoView = vi.fn() as unknown as typeof Element.prototype.scrollIntoView

// jsdom throws "Not implemented: navigation" — `src/lib/api/client.ts` calls this on 401.
Object.defineProperty(window, "location", {
  configurable: true,
  writable: true,
  value: {
    ...window.location,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
})

/* ------------------------------------------------------------------ *
 * Lifecycle
 * ------------------------------------------------------------------ */

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

/**
 * `afterEach` order is deliberate:
 *  1. cleanup()          – unmount first so effects/aborts fire while handlers are still armed;
 *                          unmounting after resetHandlers could emit "unhandled request" errors.
 *  2. resetHandlers()    – drop per-test `server.use(...)` overrides once no component can fire.
 *  3. resetAllStores()   – clear Zustand state last, after every subscriber is gone, so no
 *                          unmounting component re-populates a store we just reset.
 */
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetAllStores()
  resetNavigationMock()
})

afterAll(() => {
  server.close()
})
