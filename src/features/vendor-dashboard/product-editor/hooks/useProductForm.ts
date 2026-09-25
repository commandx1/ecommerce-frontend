"use client"

import { type ChangeEvent, useState } from "react"
import type { ProductAttribute } from "@/lib/api/products"
import type { CategoryPath } from "@/lib/category-tree"
import {
  ALL_FIELDS,
  type EditorMode,
  type FieldErrors,
  fieldsBetweenTabs,
  getTabForField,
  INITIAL_VALUES,
  type ProductFormValues,
  type TabKey,
  withoutError,
} from "../lib/product-form"
import { validateProductFields } from "../lib/validate-product-fields"

export interface SeedFormInput {
  values: ProductFormValues
  editDiscount?: string
  /** Locks the catalogue fields (plain edit only changes the listing). */
  lockCatalogueFields?: boolean
}

/**
 * Form values, attributes, the edit-only discount, field errors and the active tab. Validation
 * needs to know whether a cover photo exists, which lives in the media hook, so the two
 * validating actions take it as an argument.
 */
export function useProductForm(mode: EditorMode) {
  const [values, setValues] = useState<ProductFormValues>(INITIAL_VALUES)
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  // Discount is only used by the edit flow (updateUserProduct); it is not part of the review DTO
  const [editDiscount, setEditDiscount] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [activeTab, setActiveTab] = useState<TabKey>("basic")
  const [isProductSelected, setIsProductSelected] = useState(false)

  const clearError = (name: string) => setErrors((prev) => withoutError(prev, name))

  const validate = (fields: readonly string[], hasCoverPhoto: boolean) =>
    validateProductFields(values, { mode, editDiscount, hasCoverPhoto }, fields)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    clearError(name)
  }

  return {
    values,
    attributes,
    editDiscount,
    errors,
    activeTab,
    isProductSelected,
    handleInputChange,
    clearError,
    setBarcodeFormat: (barcodeFormats: string) => setValues((prev) => ({ ...prev, barcodeFormats })),
    setBrand: (brand: string | null) => {
      setValues((prev) => ({ ...prev, brand: brand ?? "" }))
      clearError("brand")
    },
    setCategoryPath: (categoryPath: CategoryPath | null) => {
      setValues((prev) => ({ ...prev, categoryPath, legacyCategory: null }))
      clearError("category")
    },
    toggleDentalLicense: () =>
      setValues((prev) => ({
        ...prev,
        dentalLicenseRequired: prev.dentalLicenseRequired === "Yes" ? "No" : "Yes",
      })),
    changeDiscount: (discount: string) => {
      setEditDiscount(discount)
      if (errors.discount) clearError("discount")
    },
    addAttribute: () => setAttributes((prev) => [...prev, { attributeName: "", attributeValue: "" }]),
    updateAttribute: (index: number, patch: Partial<ProductAttribute>) =>
      setAttributes((prev) => prev.map((attr, i) => (i === index ? { ...attr, ...patch } : attr))),
    removeAttribute: (index: number) => setAttributes((prev) => prev.filter((_, i) => i !== index)),

    /** Full validation for submit; on failure jumps to the tab of the first error (rule order). */
    validateAll: (hasCoverPhoto: boolean): boolean => {
      const newErrors = validate(ALL_FIELDS, hasCoverPhoto)
      setErrors(newErrors)
      const firstErrorField = Object.keys(newErrors)[0]
      if (firstErrorField) setActiveTab(getTabForField(firstErrorField))
      return !firstErrorField
    },

    /**
     * Forward moves validate every tab being left or skipped (a header click can jump Basic ->
     * Media) and merge those errors into the existing ones; backward moves are always allowed.
     */
    tryLeaveTab: (to: TabKey, hasCoverPhoto: boolean) => {
      const tabErrors = validate(fieldsBetweenTabs(activeTab, to), hasCoverPhoto)
      if (Object.keys(tabErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...tabErrors }))
        return
      }
      setActiveTab(to)
    },

    seed: ({ values: loaded, editDiscount: discount, lockCatalogueFields }: SeedFormInput) => {
      setValues(loaded)
      if (discount !== undefined) setEditDiscount(discount)
      if (lockCatalogueFields) setIsProductSelected(true)
    },
    clearErrors: () => setErrors({}),
    setSubmitError: (message: string) => setErrors({ submit: message }),

    /** Back to a blank create form on the first tab. */
    reset: () => {
      setValues(INITIAL_VALUES)
      setAttributes([])
      setEditDiscount("")
      // Land back on the first tab - otherwise starting a new product after clearing re-opens
      // wherever the vendor last was (e.g. Media), showing an empty form with the wrong tab active.
      setActiveTab("basic")
      setIsProductSelected(false)
      setErrors({})
    },
  }
}

export type ProductForm = ReturnType<typeof useProductForm>
