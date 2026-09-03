import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { ApiRequestError } from "./request"
import { fetchVariantAttributes, matchVariantAttribute } from "./variant-attributes"

let capturedAttributesBody: unknown
let capturedMatchText: string | null = null
let capturedMatchBody: Record<string, unknown> | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedAttributesBody = null
  capturedMatchText = null
  capturedMatchBody = null

  server.use(
    http.post("*/backend-api/products/variant-attributes", async ({ request }) => {
      capturedAttributesBody = await request.json()
      return HttpResponse.json({
        attributes: [
          {
            attribute: "Color",
            values: [{ value: "Translucent", selected: false, option: true, available: true, name: null }],
          },
        ],
      })
    }),
    http.post("*/backend-api/products/variant-attributes/match", async ({ request }) => {
      capturedMatchText = await request.text()
      capturedMatchBody = capturedMatchText ? JSON.parse(capturedMatchText) : null
      return HttpResponse.json({
        product: { id: "p-translucent", name: "Acme Translucent Kit", price: 42 },
        userProducts: [{ id: "up-1", price: 42, stock: 10 }],
      })
    }),
  )
})

describe("fetchVariantAttributes contract", () => {
  // A: outgoing payload — VariantAttributeOptionsRequestDto has exactly one field, `productId`.
  it("POSTs to /products/variant-attributes with body { productId } exactly", async () => {
    await fetchVariantAttributes("p-1")

    expect(capturedAttributesBody).toEqual({ productId: "p-1" })
  })

  // B: incoming data — VariantAttributeOptionGroupDto -> VariantAttributeValueOptionDto has
  // exactly these 5 fields (ProductServiceImpl.java:1049), name may be null.
  it("returns attributes[].attribute and attributes[].values[] with the 5 backend fields", async () => {
    const response = await fetchVariantAttributes("p-1")

    expect(response.attributes).toEqual([
      {
        attribute: "Color",
        values: [{ value: "Translucent", selected: false, option: true, available: true, name: null }],
      },
    ])
  })

  // C: hostile — BadRequestException -> GlobalExceptionHandler.handleBadRequestException (400,
  // {timestamp, message, status}) — extractErrorMessage reads the `message` field.
  it("rejects with the backend's message on a 400 (e.g. product has no variant group)", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes", () =>
        HttpResponse.json(
          {
            timestamp: "2026-01-01T00:00:00",
            message: "No variant of this product is currently available for sale.",
            status: 400,
          },
          { status: 400 },
        ),
      ),
    )

    const error = await fetchVariantAttributes("p-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(400)
    expect((error as ApiRequestError).message).toBe("No variant of this product is currently available for sale.")
  })

  it("rejects with the fallback message on a 500", async () => {
    server.use(http.post("*/backend-api/products/variant-attributes", () => new HttpResponse(null, { status: 500 })))

    const error = await fetchVariantAttributes("p-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(500)
    expect((error as ApiRequestError).message).toBe("Failed to fetch variant attributes")
  })

  it("rejects with the fallback message on a non-JSON error body", async () => {
    server.use(
      http.post(
        "*/backend-api/products/variant-attributes",
        () => new HttpResponse("<html>Bad Gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } }),
      ),
    )

    const error = await fetchVariantAttributes("p-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).message).toBe("Failed to fetch variant attributes")
  })

  it("rejects with the fallback message on an empty error body", async () => {
    server.use(http.post("*/backend-api/products/variant-attributes", () => new HttpResponse(null, { status: 400 })))

    const error = await fetchVariantAttributes("p-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).message).toBe("Failed to fetch variant attributes")
  })

  // C: hostile 200 bodies — the promise must still RESOLVE (never throw); it's on the caller
  // (useVariantAttributes) to turn a malformed shape into status "empty" — see
  // useVariantAttributes.test.ts for that half of the contract.
  it.each([
    ["attributes: null", { attributes: null }],
    ["attributes as a non-array", { attributes: "x" }],
    ["attributes missing entirely", {}],
  ])("resolves (does not throw) on 200 with %s", async (_label, body) => {
    server.use(http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json(body)))

    await expect(fetchVariantAttributes("p-1")).resolves.toEqual(body)
  })
})

describe("matchVariantAttribute contract", () => {
  // A: outgoing payload — VariantAttributeMatchRequestDto field names, exactly.
  it("POSTs to /products/variant-attributes/match with all 4 fields when productName is given", async () => {
    await matchVariantAttribute({
      productId: "p-1",
      chosenAttribute: "Color",
      chosenAttributeValue: "Translucent",
      productName: "Acme Translucent Kit",
    })

    expect(capturedMatchBody).toEqual({
      productId: "p-1",
      chosenAttribute: "Color",
      chosenAttributeValue: "Translucent",
      productName: "Acme Translucent Kit",
    })
  })

  // productName is optional on the DTO; when the caller omits it, the key must be ABSENT from
  // the wire body (not sent as `null`) — the service only special-cases a present, non-blank
  // productName (ProductServiceImpl.java:1111 `request.getProductName()` blank/null check would
  // otherwise be indistinguishable, but the wire shape itself is what this test pins).
  it("omits the productName key entirely (not null) when not given", async () => {
    await matchVariantAttribute({
      productId: "p-1",
      chosenAttribute: "Color",
      chosenAttributeValue: "Translucent",
    })

    expect(capturedMatchBody).toEqual({
      productId: "p-1",
      chosenAttribute: "Color",
      chosenAttributeValue: "Translucent",
    })
    expect(capturedMatchBody && "productName" in capturedMatchBody).toBe(false)
    expect(capturedMatchText?.includes("productName")).toBe(false)
  })

  // B: incoming data — response is byte-for-byte ProductWithUserProductsDto, same shape as
  // GET /products/{id}/with-user-products. The frontend reads `result.product.id`
  // (useVariantAttributes.ts) to navigate, so that's the field this pins.
  it("returns the ProductWithUserProductsDto shape (product + userProducts)", async () => {
    const result = await matchVariantAttribute({
      productId: "p-1",
      chosenAttribute: "Color",
      chosenAttributeValue: "Translucent",
    })

    expect(result.product.id).toBe("p-translucent")
    expect(result.userProducts?.[0]?.id).toBe("up-1")
  })

  // C: hostile — same BadRequestException/RuntimeException 400 shape as above; the service
  // throws BadRequestException("No product matching the selected attribute combination is
  // currently available for sale.") when no candidate matches (ProductServiceImpl.java:1157).
  it("rejects with the backend's message on a 400 (no matching product)", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes/match", () =>
        HttpResponse.json(
          { message: "No product matching the selected attribute combination is currently available for sale." },
          { status: 400 },
        ),
      ),
    )

    const error = await matchVariantAttribute({
      productId: "p-1",
      chosenAttribute: "Color",
      chosenAttributeValue: "Nonexistent",
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(400)
    expect((error as ApiRequestError).message).toBe(
      "No product matching the selected attribute combination is currently available for sale.",
    )
  })

  it("rejects with the fallback message on a 500", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes/match", () => new HttpResponse(null, { status: 500 })),
    )

    const error = await matchVariantAttribute({
      productId: "p-1",
      chosenAttribute: "Color",
      chosenAttributeValue: "Translucent",
    }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).message).toBe("Failed to switch product variant")
  })

  // C: hostile 200 bodies — resolves rather than throwing; useVariantAttributes.test.ts covers
  // how the hook (which reads `result.product.id`) turns this into a caught error + toast.
  it.each([
    ["an empty object", {}],
    ["product: null", { product: null }],
  ])("resolves (does not throw) on 200 with %s", async (_label, body) => {
    server.use(http.post("*/backend-api/products/variant-attributes/match", () => HttpResponse.json(body)))

    await expect(
      matchVariantAttribute({ productId: "p-1", chosenAttribute: "Color", chosenAttributeValue: "Translucent" }),
    ).resolves.toEqual(body)
  })
})
