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
        className="h-11 w-full rounded-none border-0 bg-transparent px-4 py-2.5 text-text-primary shadow-none placeholder:text-text-muted focus-visible:border-transparent focus-visible:ring-0"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
      />
    </div>
  )
}

export default SearchInput
