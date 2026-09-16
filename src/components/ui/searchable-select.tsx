"use client"

import { Check, ChevronDown, Search } from "lucide-react"
import { useId, useMemo, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface SearchableSelectOption {
  value: string
  label: string
  suffix?: React.ReactNode
}

export interface SearchableSelectProps {
  id?: string
  value: string | null
  onValueChange: (value: string) => void
  options: readonly SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  "aria-invalid"?: boolean
}

export default function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const listboxId = useId()
  const optionIdBase = useId()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => option.label.toLowerCase().includes(q))
  }, [options, query])

  const selectedOption = options.find((option) => option.value === value)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      const selectedIndex = options.findIndex((option) => option.value === value)
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    } else {
      setQuery("")
      setActiveIndex(0)
    }
  }

  const select = (v: string) => {
    onValueChange(v)
    handleOpenChange(false)
  }

  const handleQueryChange = (next: string) => {
    setQuery(next)
    setActiveIndex(0)
  }

  // Index-based ids: option values (category names) contain spaces, which break the
  // aria-activedescendant IDREF.
  const optionId = (index: number) => `${optionIdBase}-${index}`
  const scrollToOption = (index: number) =>
    document.getElementById(optionId(index))?.scrollIntoView?.({ block: "nearest" })

  const moveActive = (delta: number) => {
    const next = Math.min(Math.max(activeIndex + delta, 0), Math.max(filtered.length - 1, 0))
    setActiveIndex(next)
    scrollToOption(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const active = filtered[activeIndex]
      if (active) select(active.value)
    }
  }

  const activeOption = filtered[activeIndex]

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          title={selectedOption?.label}
          className={cn(
            "flex items-center justify-between gap-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("truncate", selectedOption ? "text-text-primary" : "text-text-muted")}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 min-w-[max(var(--radix-popover-trigger-width),18rem)] max-w-[calc(100vw-2rem)]"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
          scrollToOption(activeIndex)
        }}
      >
        <div className="p-2 border-b border-border-soft">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listboxId}
              aria-activedescendant={activeOption ? optionId(activeIndex) : undefined}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
        </div>

        <div role="listbox" id={listboxId} className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-text-muted text-center">{emptyText}</p>
          ) : (
            filtered.map((option, index) => {
              const isSelected = value === option.value
              const isActive = index === activeIndex
              return (
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected}
                  onClick={() => select(option.value)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer break-words hover:bg-surface-muted",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="flex-1 break-words">{option.label}</span>
                  {option.suffix}
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
