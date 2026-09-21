import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getProductWithOffers } from "@/lib/api/product-offers"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { makeAccountUser } from "@/test/factories"
import { useAddToCartFromCard } from "./useAddToCartFromCard"

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/lib/api/product-offers", () => ({
  getProductWithOffers: vi.fn(),
}))

const product = { id: "p-1", name: "Intra Oral Mixing Tips", price: 56 }

const originalAddToCart = useCartStore.getState().addToCart

beforeEach(() => {
  vi.mocked(getProductWithOffers).mockReset()
  mockToastError.mockClear()
  mockToastSuccess.mockClear()
  useAuthStore.getState().clearAuth()
  useCartStore.setState({ addToCart: originalAddToCart })
})

afterEach(() => {
  useCartStore.setState({ addToCart: originalAddToCart })
})

describe("useAddToCartFromCard guest guard", () => {
  it("never calls getProductWithOffers, returns false, redirects with login-required, and shows no toast", async () => {
    const assignMock = window.location.assign as unknown as ReturnType<typeof vi.fn>
    assignMock.mockClear()

    const { result } = renderHook(() => useAddToCartFromCard())

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.addToCart(product.id, product.name, 1)
    })

    expect(returned).toBe(false)
    expect(getProductWithOffers).not.toHaveBeenCalled()
    expect(assignMock).toHaveBeenCalledTimes(1)
    expect(String(assignMock.mock.calls[0][0])).toContain("reason=login-required")
    expect(mockToastError).not.toHaveBeenCalled()
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

describe("useAddToCartFromCard authenticated happy path", () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")
  })

  it("adds the best-price offer to the store and shows a success toast", async () => {
    vi.mocked(getProductWithOffers).mockResolvedValue({
      product,
      userProducts: [
        { id: "up-cheap", price: 10, stock: 5 },
        { id: "up-best", price: 5, stock: 5 },
      ],
    } as never)
    const mockAddToCart = vi.fn().mockResolvedValue(undefined)
    useCartStore.setState({ addToCart: mockAddToCart })

    const { result } = renderHook(() => useAddToCartFromCard())

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.addToCart(product.id, product.name, 2)
    })

    expect(mockAddToCart).toHaveBeenCalledWith("up-best", 2)
    expect(mockToastSuccess).toHaveBeenCalledWith("Added to cart", "2 × Intra Oral Mixing Tips added to your cart.")
    expect(returned).toBe(true)
  })

  it("returns false with no error toast when the store throws an auth-handled error", async () => {
    vi.mocked(getProductWithOffers).mockResolvedValue({
      product,
      userProducts: [{ id: "up-best", price: 5, stock: 5 }],
    } as never)
    const authHandledError = Object.assign(new Error("Login required"), { authHandled: true })
    const mockAddToCart = vi.fn().mockRejectedValue(authHandledError)
    useCartStore.setState({ addToCart: mockAddToCart })

    const { result } = renderHook(() => useAddToCartFromCard())

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.addToCart(product.id, product.name, 1)
    })

    expect(returned).toBe(false)
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("shows a generic error toast for a non-auth failure", async () => {
    vi.mocked(getProductWithOffers).mockResolvedValue({
      product,
      userProducts: [{ id: "up-best", price: 5, stock: 5 }],
    } as never)
    const mockAddToCart = vi.fn().mockRejectedValue(new Error("boom"))
    useCartStore.setState({ addToCart: mockAddToCart })

    const { result } = renderHook(() => useAddToCartFromCard())

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.addToCart(product.id, product.name, 1)
    })

    expect(returned).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith("Failed to add to cart", "Please try again.")
  })
})
