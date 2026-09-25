import { Barcode } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BARCODE_FORMAT_OPTIONS } from "../../lib/product-form"
import { FieldError, type FieldGroupProps, fieldClass, LABEL_CLASS } from "../field-styles"
import TextField from "../TextField"

interface IdentityFieldsProps extends FieldGroupProps {
  onBarcodeFormatChange: (format: string) => void
}

/** Name, detailed name, barcode and barcode format. */
export default function IdentityFields({
  values,
  errors,
  locked,
  onInputChange,
  onBarcodeFormatChange,
}: IdentityFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="name"
          label="Product Name *"
          value={values.name}
          error={errors.name}
          locked={locked}
          onChange={onInputChange}
          placeholder="e.g., Premium Dental Composite Kit"
        />
        <TextField
          name="detailedName"
          label="Detailed Name"
          value={values.detailedName}
          locked={locked}
          onChange={onInputChange}
          placeholder="e.g., Premium Dental Composite Kit - 20 Shades with Applicators"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="barcode" className={LABEL_CLASS}>
            <Barcode className="w-4 h-4 inline mr-1" />
            Barcode
          </label>
          {/* Never disabled, even on a locked listing (unchanged behaviour). */}
          <input
            id="barcode"
            type="text"
            name="barcode"
            value={values.barcode}
            onChange={onInputChange}
            className={fieldClass(Boolean(errors.barcode), true)}
            placeholder="e.g., 8901234567890"
          />
          <FieldError message={errors.barcode} />
        </div>

        <div>
          <label htmlFor="barcodeFormats" className={LABEL_CLASS}>
            Barcode Format
          </label>
          <Select
            name="barcodeFormats"
            value={values.barcodeFormats}
            disabled={locked}
            onValueChange={onBarcodeFormatChange}
          >
            <SelectTrigger
              id="barcodeFormats"
              className="w-full rounded-lg border-border-soft bg-surface-elevated px-4 py-3 text-text-primary shadow-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:bg-surface disabled:opacity-60"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BARCODE_FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}
