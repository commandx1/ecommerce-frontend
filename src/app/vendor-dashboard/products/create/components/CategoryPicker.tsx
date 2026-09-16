"use client"

import { ChevronRight } from "lucide-react"
import SearchableSelect from "@/components/ui/searchable-select"
import { type CategoryNode, type CategoryPath, getChildren, ROOT_CATEGORY } from "@/lib/category-tree"

export interface CategoryPickerProps {
  id?: string
  value: CategoryPath | null
  onChange: (path: CategoryPath | null) => void
  disabled?: boolean
  hasError?: boolean
  legacyValue?: string | null
  triggerClassName?: string
}

const DEFAULT_TRIGGER_CLASSNAME =
  "w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary shadow-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:bg-surface disabled:opacity-60"

interface Column {
  /** 0-based level index; Category (k + 2) in the UI. */
  k: number
  options: readonly CategoryNode[]
}

/**
 * Chain of dependent dropdowns over the static category tree.
 *
 * Level 1 is always `ROOT_CATEGORY` ("Dental Supplies") and is fixed — it is not part of the
 * tree data and cannot be changed here. The tree covers levels 2-5; each dropdown's options
 * depend on the selection made in the dropdown to its left. Picking a value truncates any
 * selections deeper than it. A new column only appears once the previous selection is a branch
 * (has children); picking a leaf ends the chain.
 */
export default function CategoryPicker({
  id,
  value,
  onChange,
  disabled,
  hasError,
  legacyValue,
  triggerClassName,
}: CategoryPickerProps) {
  const idBase = id ?? "category"
  const path = value ?? []
  const triggerClass = triggerClassName ?? DEFAULT_TRIGGER_CLASSNAME

  const columns: Column[] = [{ k: 0, options: getChildren([]) }]
  for (let k = 1; k <= path.length; k++) {
    const options = getChildren(path.slice(0, k))
    if (options.length === 0) {
      break
    }
    columns.push({ k, options })
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-text-primary mb-3">Categories *</legend>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor={`${idBase}-level-1`} className="block text-sm font-medium text-text-primary mb-2">
            Category 1
          </label>
          <SearchableSelect
            id={`${idBase}-level-1`}
            value={ROOT_CATEGORY}
            options={[{ value: ROOT_CATEGORY, label: ROOT_CATEGORY }]}
            onValueChange={() => {}}
            disabled
            className={triggerClass}
          />
        </div>

        {columns.map(({ k, options }) => {
          const levelNum = k + 2
          const selected = path[k]
          const isErrorTarget = Boolean(hasError) && k === path.length

          return (
            <div key={levelNum}>
              <label
                htmlFor={`${idBase}-level-${levelNum}`}
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Category {levelNum}
              </label>
              <SearchableSelect
                id={`${idBase}-level-${levelNum}`}
                value={selected ?? null}
                onValueChange={(next) => onChange([...path.slice(0, k), next])}
                disabled={disabled}
                aria-invalid={isErrorTarget || undefined}
                className={`${triggerClass} ${isErrorTarget ? "border-destructive" : ""}`}
                options={options.map((option) => {
                  const isBranch = !!option.children && option.children.length > 0
                  return {
                    value: option.name,
                    label: option.name,
                    suffix: isBranch ? (
                      <ChevronRight aria-hidden className="w-4 h-4 text-text-muted shrink-0" />
                    ) : undefined,
                  }
                })}
              />
            </div>
          )
        })}
      </div>

      {legacyValue && (
        <p role="note" className="text-xs text-warning mt-1">
          Previous: {legacyValue} (not in catalogue — please choose again)
        </p>
      )}
    </fieldset>
  )
}
