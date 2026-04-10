import { useId } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"

const AvailabilityFilter = () => {
  const id = useId()

  return (
    <div className="border-b border-border-soft p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Availability</h3>
      <div className="space-y-3">
        <CheckboxField id={`${id}-availability-in-stock`} label="In Stock" defaultChecked />
        <CheckboxField id={`${id}-availability-ship-today`} label="Ships Today" />
      </div>
    </div>
  )
}

export default AvailabilityFilter
