import { Info } from "lucide-react"
import { useId } from "react"
import type { ProductAttribute } from "@/lib/api/products"
import type { CategoryPath } from "@/lib/category-tree"
import CategoryPicker from "../CategoryPicker"
import { FieldError, type FieldGroupProps, fieldClass, LABEL_CLASS } from "../field-styles"
import AttributesEditor from "./AttributesEditor"
import DimensionsFields from "./DimensionsFields"
import ManufacturerFields from "./ManufacturerFields"
import ProductReferenceFields from "./ProductReferenceFields"

interface DetailsTabProps extends FieldGroupProps {
  accessToken: string | null
  attributes: ProductAttribute[]
  onBrandChange: (brand: string | null) => void
  onCategoryChange: (path: CategoryPath | null) => void
  onToggleDentalLicense: () => void
  onAddAttribute: () => void
  onUpdateAttribute: (index: number, patch: Partial<ProductAttribute>) => void
  onRemoveAttribute: (index: number) => void
}

export default function DetailsTab(props: DetailsTabProps) {
  const { values, errors, locked, onInputChange } = props
  const fields = { values, errors, locked, onInputChange }
  const categoryId = useId()
  const descriptionId = useId()

  return (
    <div className="space-y-6">
      <div className="bg-accent/45 border border-brand/25 rounded-lg p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <p className="text-accent-foreground text-sm">
          These details provide additional information about your product and help buyers make informed decisions.
        </p>
      </div>

      <ManufacturerFields {...fields} accessToken={props.accessToken} onBrandChange={props.onBrandChange} />

      <div>
        <CategoryPicker
          id={categoryId}
          value={values.categoryPath}
          legacyValue={values.legacyCategory}
          hasError={Boolean(errors.category)}
          disabled={locked}
          onChange={props.onCategoryChange}
          // The picker itself marks only the first empty level red (aria-invalid), so the
          // shared trigger class must stay neutral - a conditional border here would paint
          // every level's dropdown red at once.
          triggerClassName={fieldClass(false, true)}
        />
        <FieldError message={errors.category} />
      </div>

      <ProductReferenceFields {...fields} onToggleDentalLicense={props.onToggleDentalLicense} />

      <DimensionsFields {...fields} />

      <AttributesEditor
        attributes={props.attributes}
        locked={locked}
        onAdd={props.onAddAttribute}
        onUpdate={props.onUpdateAttribute}
        onRemove={props.onRemoveAttribute}
      />

      <div>
        <label htmlFor={descriptionId} className={LABEL_CLASS}>
          Detailed Description *
        </label>
        <textarea
          id={descriptionId}
          name="description"
          value={values.description}
          onChange={onInputChange}
          disabled={locked}
          rows={4}
          className={`w-full px-4 py-3 border ${errors.description ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent resize-none disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
          placeholder="Detailed product description..."
        />
        <FieldError message={errors.description} />
      </div>
    </div>
  )
}
