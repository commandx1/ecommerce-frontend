import { useId } from "react"
import BrandFilterDropdown from "../BrandFilterDropdown"
import { FieldError, type FieldGroupProps, fieldClass, LABEL_CLASS } from "../field-styles"
import TextField from "../TextField"

interface ManufacturerFieldsProps extends FieldGroupProps {
  accessToken: string | null
  onBrandChange: (brand: string | null) => void
}

export default function ManufacturerFields({
  values,
  errors,
  locked,
  onInputChange,
  accessToken,
  onBrandChange,
}: ManufacturerFieldsProps) {
  const brandId = useId()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TextField
        name="manufacturerCode"
        label="Manufacturer Code *"
        value={values.manufacturerCode}
        error={errors.manufacturerCode}
        locked={locked}
        onChange={onInputChange}
        placeholder="e.g., MNF-4452"
      />
      <TextField
        name="manufacturer"
        label="Manufacturer *"
        value={values.manufacturer}
        error={errors.manufacturer}
        locked={locked}
        onChange={onInputChange}
        placeholder="e.g., DentPro Inc."
      />

      <div>
        <label htmlFor={brandId} className={LABEL_CLASS}>
          Brand *
        </label>
        {/* Required single value, so no "All Brands" option (the search-view filter keeps it). */}
        <BrandFilterDropdown
          id={brandId}
          value={values.brand || null}
          onChange={onBrandChange}
          accessToken={accessToken}
          disabled={locked}
          hideAllOption
          triggerClassName={fieldClass(Boolean(errors.brand), true)}
        />
        <FieldError message={errors.brand} />
      </div>
    </div>
  )
}
