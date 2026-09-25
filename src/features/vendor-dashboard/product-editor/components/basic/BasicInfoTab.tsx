import type { EditorMode } from "../../lib/product-form"
import type { FieldGroupProps } from "../field-styles"
import EditPricingFields from "./EditPricingFields"
import IdentityFields from "./IdentityFields"
import ListingFields from "./ListingFields"

interface BasicInfoTabProps extends FieldGroupProps {
  mode: EditorMode
  discount: string
  onBarcodeFormatChange: (format: string) => void
  onDiscountChange: (discount: string) => void
}

export default function BasicInfoTab({ mode, discount, onDiscountChange, ...fields }: BasicInfoTabProps) {
  return (
    <div className="space-y-6">
      <IdentityFields {...fields} />
      {mode === "edit" ? (
        <EditPricingFields
          values={fields.values}
          errors={fields.errors}
          discount={discount}
          onInputChange={fields.onInputChange}
          onDiscountChange={onDiscountChange}
        />
      ) : (
        <ListingFields values={fields.values} errors={fields.errors} onInputChange={fields.onInputChange} />
      )}
    </div>
  )
}
