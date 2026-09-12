"use client"

import { Command } from "cmdk"
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type CategoryPath, getChildren, ROOT_CATEGORY, searchLeafPaths } from "@/lib/category-tree"

export interface CategoryPickerProps {
  id?: string
  value: CategoryPath | null
  onChange: (path: CategoryPath | null) => void
  disabled?: boolean
  hasError?: boolean
  legacyValue?: string | null
  triggerClassName?: string
}

/**
 * Search + drill-down selector over the static category tree.
 *
 * Level 1 is always `ROOT_CATEGORY` ("Dental Supplies") and is fixed — it is not part of the
 * tree data and cannot be changed here. The tree covers levels 2-5; a selection must land on a
 * leaf node (a category with no children), never an intermediate branch.
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
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState<CategoryPath>([])

  const hasValue = !!value && value.length > 0

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    setQuery("")
    if (next) {
      setLocation(hasValue && value ? value.slice(0, -1) : [])
    }
  }

  const select = (path: CategoryPath) => {
    onChange(path)
    setOpen(false)
    setQuery("")
  }

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0
  const searchResults = isSearching ? searchLeafPaths(trimmedQuery, 50) : []
  const children = getChildren(location)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="w-full">
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-invalid={hasError || undefined}
            className={`flex items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
              triggerClassName ??
              "w-full rounded-lg border border-border-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring/50"
            }`}
          >
            <span className="flex-1 truncate text-sm">
              {hasValue && value ? (
                <>
                  <span className="text-text-muted">{ROOT_CATEGORY} &gt; </span>
                  <span className="text-text-primary">{value.join(" > ")}</span>
                </>
              ) : (
                <span className="text-text-muted">Select a category</span>
              )}
            </span>
            {hasValue && !disabled && (
              // biome-ignore lint/a11y/useSemanticElements: nested inside the trigger <button>, and a nested <button> is invalid HTML
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear category"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation()
                    onChange(null)
                  }
                }}
                className="text-text-muted hover:text-text-secondary"
              >
                <X className="w-4 h-4" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </PopoverTrigger>

        {legacyValue && (
          <p role="note" className="text-xs text-warning mt-1">
            Previous: {legacyValue} (not in catalogue — please choose again)
          </p>
        )}
      </div>

      <PopoverContent align="start" className="p-0 w-[28rem] max-w-[90vw]">
        <Command shouldFilter={false} loop>
          <div className="p-2 border-b border-border-soft">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search categories…"
                aria-label="Search categories"
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-sm border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          {!isSearching && (
            <div className="flex items-center gap-1 px-3 py-2 text-xs border-b border-border-soft">
              <button
                type="button"
                aria-label="Back"
                disabled={location.length === 0}
                onClick={() => setLocation((prev) => prev.slice(0, -1))}
                className="rounded p-1 text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span data-testid="category-breadcrumb" className="truncate text-text-muted">
                {ROOT_CATEGORY}
                {location.map((crumb) => (
                  <span key={crumb}> &rsaquo; {crumb}</span>
                ))}
              </span>
            </div>
          )}

          <Command.List className="max-h-72 overflow-y-auto p-1">
            {isSearching ? (
              <>
                <Command.Empty className="px-3 py-4 text-sm text-text-muted text-center">
                  No category matches &ldquo;{trimmedQuery}&rdquo;
                </Command.Empty>
                {searchResults.map((entry) => (
                  <Command.Item
                    key={entry.label}
                    value={entry.label}
                    onSelect={() => select(entry.path)}
                    className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-surface-muted cursor-pointer data-[selected=true]:bg-surface-muted"
                  >
                    <span className="text-text-secondary truncate">{entry.label}</span>
                  </Command.Item>
                ))}
                {searchResults.length === 50 && (
                  <p className="px-3 py-2 text-xs text-text-muted">
                    Showing first 50 matches — keep typing to narrow down
                  </p>
                )}
              </>
            ) : (
              children.map((child) => {
                const childPath = [...location, child.name]
                const isBranch = !!child.children && child.children.length > 0
                const isSelected =
                  !!value && value.length === childPath.length && value.every((seg, i) => seg === childPath[i])

                return (
                  <Command.Item
                    key={child.name}
                    value={`browse:${childPath.join(" > ")}`}
                    onSelect={() => {
                      if (isBranch) {
                        setLocation(childPath)
                      } else {
                        select(childPath)
                      }
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-surface-muted cursor-pointer data-[selected=true]:bg-surface-muted"
                  >
                    <span className={isSelected ? "font-medium text-text-primary" : "text-text-secondary"}>
                      {child.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                    {isBranch && <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />}
                  </Command.Item>
                )
              })
            )}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
