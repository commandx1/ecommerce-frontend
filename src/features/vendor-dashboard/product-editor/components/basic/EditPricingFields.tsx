import type { ChangeEvent } from "react"
import type { FieldErrors, ProductFormValues } from "../../lib/product-form"
import MoneyField from "./MoneyField"

interface EditPricingFieldsProps {
  values: ProductFormValues
  errors: FieldErrors
  discount: string
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onDiscountChange: (discount: string) => void
}

/** Plain edit of an approved listing: only price, discount and stock can change. */
export default function EditPricingFields({
  values,
  errors,
  discount,
  onInputChange,
  onDiscountChange,
}: EditPricingFieldsProps) {
  return (
    <div className="border-t border-border-soft pt-6 mt-6">
      <h3 className="text-lg font-semibold text-brand mb-4">Pricing & Inventory</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MoneyField name="price" label="Price *" value={values.price} error={errors.price} onChange={onInputChange} />
        <MoneyField
          name="discount"
          label={
            <>
              Discount <span className="text-text-muted font-normal">(Optional)</span>
            </>
          }
          value={discount}
          error={errors.discount}
          onChange={(e) => onDiscountChange(e.target.value)}
        />
        <MoneyField
          name="stock"
          label="Stock *"
          value={values.stock}
          error={errors.stock}
          step="1"
          onChange={onInputChange}
        />
      </div>
    </div>
  )
}
