import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent } from "react"
import { describe, expect, it } from "vitest"
import { type EditorMode, INITIAL_VALUES, type ProductFormValues } from "../lib/product-form"
import { useProductForm } from "./useProductForm"

const input = (name: string, value: string, type = "text", checked = false) =>
  ({ target: { name, value, type, checked } }) as unknown as ChangeEvent<HTMLInputElement>

const VALID_BASIC: Partial<ProductFormValues> = {
  name: "Composite Kit",
  skuCode: "SKU-1",
  price: "42",
  stock: "7",
  shipmentFee: "5",
  heavyShippingSurcharge: "3",
  fulfillmentPolicy: "Ships within 2 days",
}

const setup = (mode: EditorMode = "create", values: Partial<ProductFormValues> = {}) => {
  const hook = renderHook(() => useProductForm(mode))
  if (Object.keys(values).length > 0) {
    act(() => hook.result.current.seed({ values: { ...INITIAL_VALUES, ...values } }))
  }
  return hook
}

describe("useProductForm — editing", () => {
  it("writes text and checkbox inputs by name and clears that field's error", () => {
    const { result } = setup()
    act(() => {
      result.current.validateAll(false)
    })
    expect(result.current.errors.name).toBe("Product name is required")

    act(() => {
      result.current.handleInputChange(input("name", "Composite Kit"))
      result.current.handleInputChange(input("exportPackaging", "on", "checkbox", true))
    })

    expect(result.current.values).toMatchObject({ name: "Composite Kit", exportPackaging: true })
    expect(result.current.errors.name).toBeUndefined()
    expect(result.current.errors.skuCode).toBe("SKU code is required")
  })

  it("setBrand and setCategoryPath clear their errors; picking a category drops the legacy hint", () => {
    const { result } = setup("reviewEdit", { legacyCategory: "Restorative > Composite" })
    act(() => {
      result.current.validateAll(true)
    })

    act(() => {
      result.current.setBrand("Acme")
      result.current.setCategoryPath(["Endodontic products"])
    })

    expect(result.current.values).toMatchObject({
      brand: "Acme",
      categoryPath: ["Endodontic products"],
      legacyCategory: null,
    })
    expect(result.current.errors.brand).toBeUndefined()
    expect(result.current.errors.category).toBeUndefined()

    act(() => result.current.setBrand(null))
    expect(result.current.values.brand).toBe("")
  })

  it("toggles the dental license flag and sets the barcode format", () => {
    const { result } = setup()
    act(() => result.current.toggleDentalLicense())
    expect(result.current.values.dentalLicenseRequired).toBe("Yes")
    act(() => {
      result.current.toggleDentalLicense()
      result.current.setBarcodeFormat("UPC_A")
    })
    expect(result.current.values).toMatchObject({ dentalLicenseRequired: "No", barcodeFormats: "UPC_A" })
  })

  it("adds, edits and removes attribute rows by index", () => {
    const { result } = setup()
    act(() => {
      result.current.addAttribute()
      result.current.addAttribute()
    })
    act(() => {
      result.current.updateAttribute(0, { attributeName: "Color" })
      result.current.updateAttribute(1, { attributeValue: "Large" })
    })
    act(() => result.current.removeAttribute(0))

    expect(result.current.attributes).toEqual([{ attributeName: "", attributeValue: "Large" }])
  })

  it("changeDiscount clears only a discount error", () => {
    const { result } = setup("edit", { price: "", stock: "5" })
    act(() => result.current.changeDiscount("-5"))
    act(() => {
      result.current.validateAll(false)
    })
    expect(result.current.errors).toEqual({
      price: "Price is required",
      discount: "Discount must be a non-negative number",
    })

    act(() => result.current.changeDiscount("10"))

    expect(result.current.editDiscount).toBe("10")
    expect(result.current.errors).toEqual({ price: "Price is required" })
  })
})

describe("useProductForm — tab gate", () => {
  it("blocks a forward move while the tab being left has errors, merging them into the existing ones", () => {
    const { result } = setup()
    act(() => result.current.setSubmitError("backend said no"))

    act(() => result.current.tryLeaveTab("details", false))

    expect(result.current.activeTab).toBe("basic")
    expect(Object.keys(result.current.errors)).toEqual([
      "submit",
      "name",
      "skuCode",
      "price",
      "stock",
      "shipmentFee",
      "heavyShippingSurcharge",
      "fulfillmentPolicy",
    ])
  })

  it("validates a skipped tab when jumping from Basic straight to Media", () => {
    const { result } = setup("create", VALID_BASIC)

    act(() => result.current.tryLeaveTab("media", false))

    expect(result.current.activeTab).toBe("basic")
    expect(result.current.errors).toHaveProperty("description")
    expect(result.current.errors).not.toHaveProperty("coverPhoto")
  })

  it("moves forward once the tab is valid and always allows moving back", () => {
    const { result } = setup("create", VALID_BASIC)

    act(() => result.current.tryLeaveTab("details", false))
    expect(result.current.activeTab).toBe("details")

    act(() => result.current.tryLeaveTab("basic", false))
    expect(result.current.activeTab).toBe("basic")
    expect(result.current.errors).toEqual({})
  })

  it("plain edit only gates on price, stock and discount", () => {
    const { result } = setup("edit", { price: "56", stock: "40" })

    act(() => result.current.tryLeaveTab("media", false))

    expect(result.current.activeTab).toBe("media")
  })
})

describe("useProductForm — validateAll", () => {
  it("replaces the errors and jumps to the tab of the first error", () => {
    const { result } = setup("create", { ...VALID_BASIC, description: "" })
    expect(result.current.activeTab).toBe("basic")

    let ok = true
    act(() => {
      ok = result.current.validateAll(false)
    })

    expect(ok).toBe(false)
    expect(Object.keys(result.current.errors)[0]).toBe("description")
    expect(result.current.activeTab).toBe("details")
  })

  it("jumps to Media when the cover photo is the only problem", () => {
    const { result } = setup("create", {
      ...VALID_BASIC,
      description: "d",
      manufacturerCode: "m",
      manufacturer: "m",
      brand: "b",
      categoryPath: ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"],
      manufacturerSiteProductPage: "https://example.com",
      weight: "1",
    })

    let ok = true
    act(() => {
      ok = result.current.validateAll(false)
    })
    expect(ok).toBe(false)
    expect(result.current.errors).toEqual({ coverPhoto: "Cover photo is required" })
    expect(result.current.activeTab).toBe("media")

    act(() => {
      ok = result.current.validateAll(true)
    })
    expect(ok).toBe(true)
    expect(result.current.errors).toEqual({})
  })
})

describe("useProductForm — seed and reset", () => {
  it("seeds loaded values, the discount and the catalogue lock", () => {
    const { result } = setup("edit")
    act(() =>
      result.current.seed({
        values: { ...INITIAL_VALUES, name: "Loaded", price: "56" },
        editDiscount: "20",
        lockCatalogueFields: true,
      }),
    )

    expect(result.current.values).toMatchObject({ name: "Loaded", price: "56" })
    expect(result.current.editDiscount).toBe("20")
    expect(result.current.isProductSelected).toBe(true)
  })

  it("reset returns every piece of form state to its initial value", () => {
    const { result } = setup("create", VALID_BASIC)
    act(() => {
      result.current.seed({
        values: { ...INITIAL_VALUES, ...VALID_BASIC },
        editDiscount: "5",
        lockCatalogueFields: true,
      })
      result.current.addAttribute()
    })
    act(() => result.current.tryLeaveTab("details", false))
    act(() => {
      result.current.validateAll(false)
    })

    act(() => result.current.reset())

    expect(result.current).toMatchObject({
      values: INITIAL_VALUES,
      attributes: [],
      editDiscount: "",
      errors: {},
      activeTab: "basic",
      isProductSelected: false,
      selectedProduct: null,
    })
  })
})
