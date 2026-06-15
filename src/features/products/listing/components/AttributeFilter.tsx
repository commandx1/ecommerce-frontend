"use client"

import { Search } from "lucide-react"
import { useId, useState } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { Input } from "@/components/ui/input"
import type { AttributeGroup } from "@/lib/api/public-products"
import { useExpandableList } from "../hooks/useExpandableList"
import { useProductFiltersNavigation } from "../hooks/useProductFiltersNavigation"

interface AttributeFilterProps {
  group: AttributeGroup
}

const AttributeFilter = ({ group }: AttributeFilterProps) => {
  const uid = useId()
  const [search, setSearch] = useState("")
  const { navigate, currentAttributes } = useProductFiltersNavigation()

  const activeForGroup = currentAttributes.filter((a) => a.startsWith(`${group.attributeName}:`))

  const filtered = search
    ? group.values.filter((v) => v.value.toLowerCase().includes(search.toLowerCase()))
    : group.values

  const { showAll, visibleItems, toggleShowAll } = useExpandableList(filtered)

  const toggle = (value: string) => {
    const key = `${group.attributeName}:${value}`
    const next = currentAttributes.includes(key)
      ? currentAttributes.filter((a) => a !== key)
      : [...currentAttributes, key]
    navigate({ attributes: next })
  }

  const label = group.attributeName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{label}</h3>
        {activeForGroup.length > 0 && (
          <button
            type="button"
            onClick={() => navigate({ attributes: currentAttributes.filter((a) => !a.startsWith(`${group.attributeName}:`)) })}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {group.values.length > 8 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <Input
            type="text"
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full py-2 pr-4 pl-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {visibleItems.map((option) => (
          <div key={option.value} className="flex items-center justify-between gap-2">
            <CheckboxField
              id={`${uid}-attr-${group.attributeName}-${option.value}`}
              label={option.value}
              checked={currentAttributes.includes(`${group.attributeName}:${option.value}`)}
              onChange={() => toggle(option.value)}
            />
            <span className="shrink-0 text-xs text-text-muted">{option.count}</span>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm italic text-text-muted">No options found</p>}
      </div>
      {filtered.length > 8 && (
        <button type="button" onClick={toggleShowAll} className="mt-4 text-sm font-medium text-brand hover:underline">
          {showAll ? "Show less" : `Show ${filtered.length - 8} more`}
        </button>
      )}
    </div>
  )
}

export default AttributeFilter
