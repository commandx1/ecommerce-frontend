import { describe, expect, it } from "vitest"
import type { DocumentProductsResponse } from "@/lib/api/vendor-documents"
import { makeUserProductDetailResponse } from "@/test/factories"
import {
  buildReasonLookup,
  columnLabel,
  columnValue,
  humanizeColumn,
  pickCell,
  pickNumericCell,
  toRows,
} from "./document-products-rows"

describe("humanizeColumn", () => {
  it("turns snake_case into Title Case", () => {
    expect(humanizeColumn("some_extra_column")).toBe("Some Extra Column")
  })

  it("splits camelCase without breaking runs of capitals", () => {
    expect(humanizeColumn("skuCode")).toBe("Sku Code")
  })

  it("returns the key unchanged when it has no words", () => {
    expect(humanizeColumn("")).toBe("")
  })
})

describe("columnLabel", () => {
  it("uses the known label case-insensitively", () => {
    expect(columnLabel("Heavy_Shipping_Surcharge")).toBe("Heavy Shipping Fee")
  })

  it("falls back to humanizeColumn for an unknown column", () => {
    expect(columnLabel("custom_field")).toBe("Custom Field")
  })
})

describe("columnValue", () => {
  it("formats a money column as currency", () => {
    expect(columnValue("price", "43.4")).toBe("$43.40")
  })

  it("leaves a non-numeric money cell untouched", () => {
    expect(columnValue("price", "n/a")).toBe("n/a")
  })

  it("leaves a non-money column untouched", () => {
    expect(columnValue("sku", "43.4")).toBe("43.4")
  })
})

describe("pickCell", () => {
  it("matches a candidate key case-insensitively", () => {
    expect(pickCell({ Product_Name: "Mixing Tips" }, ["product_name"])).toBe("Mixing Tips")
  })

  it("returns empty string when no candidate matches", () => {
    expect(pickCell({ foo: "bar" }, ["product_name"])).toBe("")
  })

  it("skips a blank match and falls through to the next candidate", () => {
    expect(pickCell({ sku: "   ", manufacturer_code: "MC-1" }, ["sku", "manufacturer_code"])).toBe("MC-1")
  })
})

describe("pickNumericCell", () => {
  it("parses a plain number", () => {
    expect(pickNumericCell({ price: "43.4" }, ["price"])).toBe(43.4)
  })

  it("strips a currency symbol", () => {
    expect(pickNumericCell({ price: "$43.4" }, ["price"])).toBe(43.4)
  })

  it("returns null for a value that still is not numeric after stripping", () => {
    expect(pickNumericCell({ price: "n/a" }, ["price"])).toBeNull()
  })

  it("returns null when the cell is absent", () => {
    expect(pickNumericCell({}, ["price"])).toBeNull()
  })
})

describe("buildReasonLookup", () => {
  it("maps a row number to its reason", () => {
    const lookup = buildReasonLookup(["Row 2: Missing price", "Row 5: Invalid SKU"])
    expect(lookup.get(2)).toBe("Missing price")
    expect(lookup.get(5)).toBe("Invalid SKU")
  })

  it("ignores an unparseable issue line", () => {
    expect(buildReasonLookup(["Something went wrong"]).size).toBe(0)
  })
})

describe("toRows", () => {
  const response = (overrides: Partial<DocumentProductsResponse> = {}): DocumentProductsResponse => ({
    documentId: "doc-1",
    products: [],
    wrongRows: [],
    ...overrides,
  })

  it("maps a successful product row", () => {
    const rows = toRows(
      response({
        products: [
          {
            status: "success",
            product: makeUserProductDetailResponse({
              productName: "Mixing Tips",
              skuCode: "SKU-1",
              price: 12,
              stock: 5,
            }),
          },
        ],
      }),
      [],
    )

    expect(rows).toEqual([
      expect.objectContaining({
        id: "product-0",
        status: "success",
        name: "Mixing Tips",
        sku: "SKU-1",
        price: 12,
        stock: 5,
      }),
    ])
  })

  it("defaults a missing product status to unknown", () => {
    const rows = toRows(response({ products: [{ status: null, product: makeUserProductDetailResponse() }] }), [])
    expect(rows[0]?.status).toBe("unknown")
  })

  it("matches a wrong row to its reason by row number", () => {
    const rows = toRows(response({ wrongRows: [{ row: "2", product_name: "Bad Product", sku: "SKU-9" }] }), [
      "Row 2: Missing price",
    ])

    expect(rows).toEqual([
      expect.objectContaining({
        id: "wrong-0",
        status: "wrong",
        name: "Bad Product",
        sku: "SKU-9",
        reason: "Missing price",
        raw: { row: "2", product_name: "Bad Product", sku: "SKU-9" },
      }),
    ])
  })

  it("falls back to positional pairing when row numbers cannot be parsed and the counts line up", () => {
    const rows = toRows(response({ wrongRows: [{ product_name: "Bad Product" }] }), ["Row ?: Missing price"])
    expect(rows[0]?.reason).toBeNull()
  })

  it("concatenates product rows before wrong rows", () => {
    const rows = toRows(
      response({
        products: [{ status: "success", product: makeUserProductDetailResponse() }],
        wrongRows: [{ product_name: "Bad" }],
      }),
      [],
    )
    expect(rows.map((row) => row.id)).toEqual(["product-0", "wrong-0"])
  })
})
