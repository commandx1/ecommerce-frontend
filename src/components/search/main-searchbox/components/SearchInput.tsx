"use client"

import type { ChangeEventHandler, RefObject } from "react"

import { Input } from "@/components/ui/input"

interface SearchInputProps {
  inputRef: RefObject<HTMLInputElement>
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  onFocus: () => void
}

const SearchInput = ({ inputRef, value, onChange, onFocus }: SearchInputProps) => {
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search products, brands, or suppliers..."
        className="h-10 w-full rounded-l-xl rounded-r-none border-0 bg-transparent px-3.5 py-2 text-sm text-text-primary shadow-none placeholder:text-text-muted focus-visible:border-transparent focus-visible:ring-0 sm:h-11 sm:rounded-l-2xl sm:px-4 sm:py-2.5 sm:text-base"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
      />
    </div>
  )
}

export default SearchInput
