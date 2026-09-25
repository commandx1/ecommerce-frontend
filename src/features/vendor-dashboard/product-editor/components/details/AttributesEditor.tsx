import { Plus, X } from "lucide-react"
import type { ProductAttribute } from "@/lib/api/products"

interface AttributesEditorProps {
  attributes: ProductAttribute[]
  locked: boolean
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<ProductAttribute>) => void
  onRemove: (index: number) => void
}

const ATTRIBUTE_INPUT_CLASS =
  "flex-1 px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"

/** Free-form name/value pairs; rows missing either half are dropped from the payload. */
export default function AttributesEditor({ attributes, locked, onAdd, onUpdate, onRemove }: AttributesEditorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-text-primary">Attributes</h4>
        <button
          type="button"
          onClick={onAdd}
          disabled={locked}
          className="inline-flex items-center px-3 py-1.5 bg-surface text-text-primary text-sm rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Attribute
        </button>
      </div>

      {attributes.length === 0 ? (
        <p className="text-text-muted text-sm">
          No attributes added. Use "Add Attribute" to define name/value pairs (e.g., Color / Blue).
        </p>
      ) : (
        <div className="space-y-3">
          {attributes.map((attribute, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are editable and have no stable id
            <div key={index} className="flex items-center gap-4">
              <input
                type="text"
                value={attribute.attributeName}
                onChange={(e) => onUpdate(index, { attributeName: e.target.value })}
                disabled={locked}
                className={ATTRIBUTE_INPUT_CLASS}
                placeholder="Attribute name (e.g., Color)"
              />
              <input
                type="text"
                value={attribute.attributeValue}
                onChange={(e) => onUpdate(index, { attributeValue: e.target.value })}
                disabled={locked}
                className={ATTRIBUTE_INPUT_CLASS}
                placeholder="Attribute value (e.g., Blue)"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={locked}
                className="w-8 h-8 shrink-0 bg-destructive/10 text-destructive rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
