import { useId } from "react"

interface PurchaseOrderSectionProps {
  department: string
  poNumber: string
  specialInstructions: string
  updateDepartment: (value: string) => void
  updatePONumber: (value: string) => void
  updateSpecialInstructions: (value: string) => void
}

export default function PurchaseOrderSection({
  department,
  poNumber,
  specialInstructions,
  updateDepartment,
  updatePONumber,
  updateSpecialInstructions,
}: PurchaseOrderSectionProps) {
  const id = useId()

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Information (Optional)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`${id}-po`} className="block text-sm font-medium text-gray-700 mb-2">
            PO Number
          </label>
          <input
            id={`${id}-po`}
            type="text"
            value={poNumber}
            onChange={(event) => updatePONumber(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter PO number"
          />
        </div>
        <div>
          <label htmlFor={`${id}-department`} className="block text-sm font-medium text-gray-700 mb-2">
            Department/Cost Center
          </label>
          <input
            id={`${id}-department`}
            type="text"
            value={department}
            onChange={(event) => updateDepartment(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter department"
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={`${id}-instructions`} className="block text-sm font-medium text-gray-700 mb-2">
          Special Instructions
        </label>
        <textarea
          id={`${id}-instructions`}
          value={specialInstructions}
          onChange={(event) => updateSpecialInstructions(event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
          rows={3}
          placeholder="Any special delivery or billing instructions..."
        />
      </div>
    </div>
  )
}
