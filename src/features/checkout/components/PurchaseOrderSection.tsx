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
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Purchase Order Information (Optional)</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-po`} className="mb-2 block text-sm font-medium text-text-secondary">
            PO Number
          </label>
          <input
            id={`${id}-po`}
            type="text"
            value={poNumber}
            onChange={(event) => updatePONumber(event.target.value)}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter PO number"
          />
        </div>
        <div>
          <label htmlFor={`${id}-department`} className="mb-2 block text-sm font-medium text-text-secondary">
            Department/Cost Center
          </label>
          <input
            id={`${id}-department`}
            type="text"
            value={department}
            onChange={(event) => updateDepartment(event.target.value)}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter department"
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={`${id}-instructions`} className="mb-2 block text-sm font-medium text-text-secondary">
          Special Instructions
        </label>
        <textarea
          id={`${id}-instructions`}
          value={specialInstructions}
          onChange={(event) => updateSpecialInstructions(event.target.value)}
          className="w-full rounded-lg border border-border-soft bg-surface px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
          rows={3}
          placeholder="Any special delivery or billing instructions..."
        />
      </div>
    </div>
  )
}
