"use client"

import { useId } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"

const AvailabilityFilter = () => {
  const uid = useId()
  const { navigate, currentInStock } = useProductFiltersNavigation()
  const isFiltered = !currentInStock

  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Availability</h3>
        {isFiltered && (
          <button
            type="button"
            onClick={() => navigate({ inStock: true })}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-3">
        <CheckboxField
          id={`${uid}-availability-in-stock`}
          label="In Stock"
          checked={currentInStock}
          onChange={() => navigate({ inStock: !currentInStock })}
        />
      </div>
    </div>
  )
}

export default AvailabilityFilter
