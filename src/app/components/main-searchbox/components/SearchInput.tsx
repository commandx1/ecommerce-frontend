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
        className="rounded-none flex-1 w-full px-4 py-2.5 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
      />
    </div>
  )
}

export default SearchInput
