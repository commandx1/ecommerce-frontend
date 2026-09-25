import type { FieldGroupProps } from "../field-styles"
import TextField from "../TextField"

interface ProductReferenceFieldsProps extends FieldGroupProps {
  onToggleDentalLicense: () => void
}

/** Manufacturer page, the dental-license switch and the example-variations product id. */
export default function ProductReferenceFields({
  values,
  errors,
  locked,
  onInputChange,
  onToggleDentalLicense,
}: ProductReferenceFieldsProps) {
  const licenseRequired = values.dentalLicenseRequired === "Yes"

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="manufacturerSiteProductPage"
          label="Manufacturer Site Product Page *"
          type="url"
          value={values.manufacturerSiteProductPage}
          error={errors.manufacturerSiteProductPage}
          locked={locked}
          onChange={onInputChange}
          placeholder="https://example.com/products/item"
        />

        <div>
          <span className="block text-sm font-medium text-text-primary mb-2">Dental License Required *</span>
          <label className="flex items-center gap-3 cursor-pointer mt-1">
            <button
              type="button"
              role="switch"
              aria-checked={licenseRequired}
              onClick={onToggleDentalLicense}
              disabled={locked}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 ${
                licenseRequired ? "bg-brand" : "bg-surface-muted border border-border-soft"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  licenseRequired ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-text-primary">{licenseRequired ? "Yes" : "No"}</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextField
          name="exampleVariationsProductId"
          label="Example Variations Product ID"
          value={values.exampleVariationsProductId}
          locked={locked}
          onChange={onInputChange}
          placeholder="Related product ID"
        />
      </div>
    </>
  )
}
