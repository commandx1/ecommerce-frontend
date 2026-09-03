import { loadStripe } from "@stripe/stripe-js"
import { renderHook } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * `stripePromiseCache` is a module-level `Map`, so a key looked up in one test would otherwise
 * still be cached in the next. Each test resets the module registry and re-imports the hook
 * fresh, so every test starts with an empty cache. `loadStripe` itself stays mocked as a single
 * instance for the whole file (that's how `vi.mock` works), so its call history is cleared by
 * hand instead.
 */
vi.mock("@stripe/stripe-js", () => ({ loadStripe: vi.fn(() => Promise.resolve({})) }))

const mockedLoadStripe = vi.mocked(loadStripe)

async function loadHook() {
  vi.resetModules()
  const { useStripePromise } = await import("./useStripePromise")
  const { StripeConfigProvider } = await import("@/components/providers/StripeConfigProvider")
  return { useStripePromise, StripeConfigProvider }
}

let previousKey: string | undefined

beforeEach(() => {
  previousKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  mockedLoadStripe.mockClear()
})

afterEach(() => {
  if (previousKey === undefined) {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  } else {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = previousKey
  }
  vi.resetModules()
})

describe("useStripePromise", () => {
  it("returns null and never calls loadStripe when no key is configured anywhere", async () => {
    const { useStripePromise } = await loadHook()

    const { result } = renderHook(() => useStripePromise())

    expect(result.current).toBeNull()
    expect(mockedLoadStripe).not.toHaveBeenCalled()
  })

  it("calls loadStripe once with the env var key when there is no provider", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_env_123"
    const { useStripePromise } = await loadHook()

    const { result } = renderHook(() => useStripePromise())

    expect(result.current).not.toBeNull()
    expect(mockedLoadStripe).toHaveBeenCalledTimes(1)
    expect(mockedLoadStripe).toHaveBeenCalledWith("pk_env_123")
  })

  it("prefers the provider key over the env var when both are set", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_env_123"
    const { useStripePromise, StripeConfigProvider } = await loadHook()

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StripeConfigProvider, { publishableKey: "pk_provider_456", children })

    renderHook(() => useStripePromise(), { wrapper })

    expect(mockedLoadStripe).toHaveBeenCalledTimes(1)
    expect(mockedLoadStripe).toHaveBeenCalledWith("pk_provider_456")
  })

  it("reuses the cached promise across hook instances for the same key", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_same_key"
    const { useStripePromise } = await loadHook()

    renderHook(() => useStripePromise())
    renderHook(() => useStripePromise())

    expect(mockedLoadStripe).toHaveBeenCalledTimes(1)
  })

  it("calls loadStripe again for a different key", async () => {
    const { useStripePromise, StripeConfigProvider } = await loadHook()

    const wrapperFor = (key: string) =>
      function Wrapper({ children }: { children: ReactNode }) {
        return createElement(StripeConfigProvider, { publishableKey: key, children })
      }

    renderHook(() => useStripePromise(), { wrapper: wrapperFor("pk_key_one") })
    renderHook(() => useStripePromise(), { wrapper: wrapperFor("pk_key_two") })

    expect(mockedLoadStripe).toHaveBeenCalledTimes(2)
    expect(mockedLoadStripe).toHaveBeenNthCalledWith(1, "pk_key_one")
    expect(mockedLoadStripe).toHaveBeenNthCalledWith(2, "pk_key_two")
  })
})
