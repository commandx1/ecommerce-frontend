import { type ChangeEvent, Children, type ComponentProps, isValidElement } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { textLikeControlClassName } from "./controlStyles"
import { FormField } from "./FormField"

const baseSelectClassName = cn("w-full", textLikeControlClassName)

interface SelectFieldProps extends Omit<ComponentProps<"select">, "className"> {
  label: string
  error?: string
  containerClassName?: string
  selectClassName?: string
}

export const SelectField = ({
  label,
  error,
  containerClassName,
  selectClassName,
  id,
  required,
  name,
  value,
  defaultValue,
  disabled,
  onChange,
  children,
}: SelectFieldProps) => {
  const normalizedOptions = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<ComponentProps<"option">>(child) || child.type !== "option") {
      return []
    }

    const optionValue = String(child.props.value ?? "")
    const optionLabel = child.props.children
    const optionDisabled = Boolean(child.props.disabled)

    return [{ value: optionValue, label: optionLabel, disabled: optionDisabled }]
  })

  const placeholderOption = normalizedOptions.find((option) => option.value === "")
  const options = normalizedOptions.filter((option) => option.value !== "")
  const fallbackPlaceholder = typeof placeholderOption?.label === "string" ? placeholderOption.label : "Select option"

  const currentValue = value !== undefined ? String(value) : undefined
  const initialValue = defaultValue !== undefined ? String(defaultValue) : undefined

  const handleValueChange = (nextValue: string) => {
    if (!onChange) {
      return
    }

    const syntheticEvent = {
      target: {
        name: name ?? "",
        value: nextValue,
      },
    } as ChangeEvent<HTMLSelectElement>

    onChange(syntheticEvent)
  }

  return (
    <FormField label={label} htmlFor={id} required={required} error={error} className={containerClassName}>
      <Select
        name={name}
        value={currentValue}
        defaultValue={initialValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={id} className={cn(baseSelectClassName, error ? "border-danger" : "", selectClassName)}>
          <SelectValue placeholder={fallbackPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
