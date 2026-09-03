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

  // C: hostile 200 bodies from /variant-attributes. sortVariantGroups/toVariantChoices
  // (variantAttributeTransforms.ts) already guard every one of these with Array.isArray checks -
  // the hook must never throw and must settle on a real status, not hang in "loading".
  describe("hostile 200 bodies from the attributes fetch", () => {
    it.each([
      ["attributes: null", { attributes: null }],
      ["attributes: {} (not an array)", { attributes: {} }],
      ["a group whose values is null", { attributes: [{ attribute: "Size", values: null }] }],
    ])("resolves to status 'empty' without throwing when %s", async (_label, body) => {
      server.use(http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json(body)))

      const { result } = renderHook(() => useVariantAttributes("p-1"))

      await waitFor(() => expect(result.current.status).toBe("empty"))
      expect(result.current.groups).toEqual([])
      expect(mockToastError).not.toHaveBeenCalled()
    })

    it("keeps only the valid rows (drops value: null and value: 42) and still reaches 'ready'", async () => {
      server.use(
        http.post("*/backend-api/products/variant-attributes", () =>
          HttpResponse.json({
            attributes: [
              {
                attribute: "Size",
                values: [
                  { value: null, selected: false, option: true, available: true, name: null },
                  { value: 42, selected: false, option: true, available: true, name: null },
                  { value: "Large", selected: false, option: true, available: true, name: null },
                ],
              },
            ],
          }),
        ),
      )

      const { result } = renderHook(() => useVariantAttributes("p-1"))

      await waitFor(() => expect(result.current.status).toBe("ready"))
      expect(result.current.groups).toEqual([
        { attribute: "Size", choices: [expect.objectContaining({ value: "Large" })] },
      ])
    })
  })

  // C: hostile 200 bodies from /variant-attributes/match. The hook reads `result.product.id`
  // (useVariantAttributes.ts) - neither shape below has a usable `product.id`, so that read
  // throws a TypeError; it must land in the same catch block as a real backend failure (toast,
  // pendingValue cleared, no navigation), not escape as an unhandled rejection.
  describe("hostile 200 bodies from the match request", () => {
    it.each([
      ["an empty object", {}],
      ["product: null", { product: null }],
    ])(
      "toasts an error, clears pendingValue, and does not navigate when the match response is %s",
      async (_label, body) => {
        server.use(
          http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json({ attributes: [] })),
          http.post("*/backend-api/products/variant-attributes/match", () => HttpResponse.json(body)),
        )

        const { result } = renderHook(() => useVariantAttributes("p-1"))
        await waitFor(() => expect(result.current.status).toBe("empty"))

        await act(async () => {
          await result.current.select({ attribute: "Color", value: "Translucent" })
        })

        expect(mockToastError).toHaveBeenCalledTimes(1)
        expect(mockToastError.mock.calls[0]?.[0]).toBe("Couldn't switch variant")
        // The user must never see the engine's own wording ("Cannot read properties of ...").
        expect(mockToastError.mock.calls[0]?.[1]).toBe("Please try again.")
        expect(result.current.pendingValue).toBeNull()
        expect(getRouterMock().push).not.toHaveBeenCalled()
      },
    )
  })
})
