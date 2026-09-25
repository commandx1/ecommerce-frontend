import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { queryKeys } from "@/lib/query/keys"
import { server } from "@/mocks/server"
import { makeVendorUserProduct } from "@/test/factories"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { createQueryWrapper } from "@/test/render"
import type { SubmitProductInput } from "../api/product-editor-commands"
import { INITIAL_VALUES } from "../lib/product-form"
import { INITIAL_EXISTING_IMAGES, INITIAL_LINKED_IMAGES, INITIAL_PHOTO_FILES } from "../lib/product-media"
import { useProductSubmit } from "./useProductSubmit"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const UPDATE_LISTING: SubmitProductInput = {
  branch: "updateListing",
  values: { ...INITIAL_VALUES, price: "56", stock: "40" },
  editDiscount: "",
  attributes: [],
  photoFiles: INITIAL_PHOTO_FILES,
  existingImages: INITIAL_EXISTING_IMAGES,
  linkedImages: INITIAL_LINKED_IMAGES,
  userProductId: "up-9",
  reviewProductId: null,
}

const setup = (mode: "create" | "edit" = "edit") => {
  const { wrapper, client } = createQueryWrapper()
  const invalidate = vi.spyOn(client, "invalidateQueries")
  const onError = vi.fn()
  const hook = renderHook(() => useProductSubmit({ mode, accessToken: "vendor-token", onError }), { wrapper })
  return { ...hook, invalidate, onError }
}

beforeEach(() => {
  for (const spy of Object.values(toastSpies)) spy.mockClear()
})

describe("useProductSubmit", () => {
  it("sends the branch's request, toasts, invalidates brands and stats, then returns to the list", async () => {
    let body: unknown = null
    server.use(
      http.put("*/api/user-products/:id", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(makeVendorUserProduct({ id: "up-9" }))
      }),
    )
    const { result, invalidate, onError } = setup()

    act(() => result.current.submit(UPDATE_LISTING))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Product updated successfully!"))
    expect(body).toEqual({ price: 56, discount: 0, stock: 40, active: true })
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      queryKeys.vendor.products.brands(),
      queryKeys.vendor.products.stats(),
    ])
    expect(getRouterMock().push).toHaveBeenCalledWith("/vendor-dashboard/products")
    expect(onError).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })

  it("is submitting while the request is in flight", async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.put("*/api/user-products/:id", async () => {
        await gate
        return HttpResponse.json(makeVendorUserProduct())
      }),
    )
    const { result } = setup()

    act(() => result.current.submit(UPDATE_LISTING))
    await waitFor(() => expect(result.current.isSubmitting).toBe(true))

    release()
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })

  it("hands a failure message to onError and toasts the same message, without invalidating or navigating", async () => {
    server.use(http.put("*/api/user-products/:id", () => new HttpResponse(null, { status: 500 })))
    const { result, onError, invalidate } = setup()

    act(() => result.current.submit(UPDATE_LISTING))

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    const message = onError.mock.calls[0]?.[0]
    expect(message).toEqual(expect.any(String))
    expect(message).not.toBe("")
    expect(toastSpies.error).toHaveBeenCalledWith(message)
    expect(invalidate).not.toHaveBeenCalled()
    expect(getRouterMock().push).not.toHaveBeenCalled()
  })
})
