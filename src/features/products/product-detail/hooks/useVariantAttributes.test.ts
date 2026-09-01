import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { useVariantAttributes } from "./useVariantAttributes"

const mockToastError = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

let capturedMatchBody: unknown

beforeEach(() => {
  mockToastError.mockClear()
  capturedMatchBody = null
})

describe("useVariantAttributes", () => {
  // Every backend failure on this endpoint is HTTP 400 - including "this product has no
  // variants" - so an error here can't be told apart from that normal case and must stay silent.
  it("resolves to status 'empty' without toasting when the attributes fetch fails (400)", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes", () =>
        HttpResponse.json({ message: "No variant of this product is currently available for sale." }, { status: 400 }),
      ),
    )

    const { result } = renderHook(() => useVariantAttributes("p-1"))

    await waitFor(() => expect(result.current.status).toBe("empty"))
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("navigates to the matched product's id on a successful select", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes", () =>
        HttpResponse.json({
          attributes: [
            {
              attribute: "Color",
              values: [{ value: "Translucent", selected: false, option: true, available: true, name: null }],
            },
          ],
        }),
      ),
      http.post("*/backend-api/products/variant-attributes/match", async ({ request }) => {
        capturedMatchBody = await request.json()
        return HttpResponse.json({ product: { id: "p-translucent" }, userProducts: [] })
      }),
    )

    const { result } = renderHook(() => useVariantAttributes("p-1"))
    await waitFor(() => expect(result.current.status).toBe("ready"))

    await act(async () => {
      await result.current.select({ attribute: "Color", value: "Translucent" })
    })

    expect(getRouterMock().push).toHaveBeenCalledWith("/products/p-translucent")
  })

  it("sends productName in the /match request when selecting an ambiguous choice", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json({ attributes: [] })),
      http.post("*/backend-api/products/variant-attributes/match", async ({ request }) => {
        capturedMatchBody = await request.json()
        return HttpResponse.json({ product: { id: "p-2" }, userProducts: [] })
      }),
    )

    const { result } = renderHook(() => useVariantAttributes("p-1"))
    await waitFor(() => expect(result.current.status).toBe("empty"))

    await act(async () => {
      await result.current.select({
        attribute: "Packaging",
        value: "Package of 200 tips",
        productName: "MARK3 Mixing Tips 200/Pk. Disposable White Tips",
      })
    })

    expect(capturedMatchBody).toEqual({
      productId: "p-1",
      chosenAttribute: "Packaging",
      chosenAttributeValue: "Package of 200 tips",
      productName: "MARK3 Mixing Tips 200/Pk. Disposable White Tips",
    })
  })

  it("toasts the backend's message when /match fails", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json({ attributes: [] })),
      http.post("*/backend-api/products/variant-attributes/match", () =>
        HttpResponse.json({ message: "No variant of this product is currently available for sale." }, { status: 400 }),
      ),
    )

    const { result } = renderHook(() => useVariantAttributes("p-1"))
    await waitFor(() => expect(result.current.status).toBe("empty"))

    await act(async () => {
      await result.current.select({ attribute: "Color", value: "Translucent" })
    })

    expect(mockToastError).toHaveBeenCalledWith(
      "Couldn't switch variant",
      "No variant of this product is currently available for sale.",
    )
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })
})
