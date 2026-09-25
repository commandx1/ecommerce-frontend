import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SelectField({
  label,
  value,
  onChange,
  options,
  compact = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<string>
  compact?: boolean
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full appearance-none rounded-lg border border-border-soft bg-surface px-4 pr-9 text-sm text-text-primary outline-none transition-colors focus:border-brand",
          compact ? "h-10" : "h-11",
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </div>
  )
}
