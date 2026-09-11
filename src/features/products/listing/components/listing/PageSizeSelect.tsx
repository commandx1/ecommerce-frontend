"use client"

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PageSizeOption {
  size: number
  href: string
}

interface PageSizeSelectProps {
  pageSize: number
  options: PageSizeOption[]
}

const PageSizeSelect = ({ pageSize, options }: PageSizeSelectProps) => {
  const router = useRouter()

  const handleValueChange = (value: string) => {
    const option = options.find((item) => String(item.size) === value)
    if (option) {
      router.push(option.href)
    }
  }

  return (
    <Select value={String(pageSize)} onValueChange={handleValueChange}>
      <SelectTrigger size="sm" aria-label="Items per page" className="min-w-[5rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.size} value={String(option.size)}>
            {option.size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default PageSizeSelect
