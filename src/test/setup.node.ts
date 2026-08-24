import { afterAll, afterEach, beforeAll } from "vitest"
import { server } from "@/mocks/server"

/**
 * Setup for the `node` Vitest project (route handlers, middleware and server-side fetchers).
 *
 * It deliberately does NOT load `src/test/setup.ts`: that file installs jsdom polyfills
 * (`window.matchMedia`, `window.location`, IntersectionObserver) and React-oriented module mocks
 * (`next/image`, `next/link`, `next/navigation`, `motion`) which have no meaning — and would
 * throw — outside a DOM. Route handlers must run against the real `next/server` primitives, so
 * the only shared piece here is the MSW request interceptor.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
