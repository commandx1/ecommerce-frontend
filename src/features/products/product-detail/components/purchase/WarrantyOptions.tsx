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
      <div className="block text-sm font-medium text-gray-700 mb-3">Extended Warranty</div>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedValue === option.value
          return (
            <div
              key={option.id}
              className={`flex items-start justify-between gap-4 rounded-lg p-3 hover:bg-gray-50 ${
                isSelected ? "bg-emerald-50/40 ring-1 ring-emerald-200" : ""
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
              <div className="font-semibold text-steel-blue whitespace-nowrap">{option.price}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WarrantyOptions
