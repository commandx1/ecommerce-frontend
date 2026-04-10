import { RadioField } from "@/components/form/RadioField"

interface WarrantyOption {
  id: number
  value: string
  title: string
  description: string
  price: string
  selected: boolean
}

interface WarrantyOptionsProps {
  options: WarrantyOption[]
  selectedValue: string
  onChange: (value: string) => void
}

const WarrantyOptions = ({ options, selectedValue, onChange }: WarrantyOptionsProps) => {
  return (
    <div>
      <div className="mb-3 block text-sm font-medium text-text-primary">Extended Warranty</div>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedValue === option.value
          return (
            <div
              key={option.id}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors ${
                isSelected
                  ? "border-success/30 bg-success/8 ring-1 ring-success/15"
                  : "border-border-soft bg-surface-elevated hover:bg-surface-muted/70"
              }`}
            >
              <RadioField
                id={`warranty-${option.id}`}
                name="warranty"
                value={option.value}
                checked={isSelected}
                onChange={(event) => onChange(event.target.value)}
                label={option.title}
                description={option.description}
                radioClassName="mt-1"
                containerClassName="items-start"
              />
              <div className="whitespace-nowrap font-semibold text-brand">{option.price}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WarrantyOptions
