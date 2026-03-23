import { CheckboxField } from "@/components/form/CheckboxField"

const AvailabilityFilter = () => {
  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Availability</h3>
      <div className="space-y-3">
        <CheckboxField id="availability-in-stock" label="In Stock" defaultChecked />
        <CheckboxField id="availability-ship-today" label="Ships Today" />
      </div>
    </div>
  )
}

export default AvailabilityFilter
