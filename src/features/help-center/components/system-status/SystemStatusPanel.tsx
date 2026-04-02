import SystemStatusCard from "@/features/help-center/components/SystemStatusCard"
import type { SystemStatusItem } from "@/features/help-center/types"

interface SystemStatusPanelProps {
  items: SystemStatusItem[]
}

export default function SystemStatusPanel({ items }: SystemStatusPanelProps) {
  return (
    <div className="rounded-2xl bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-steel-blue">Current System Status</h3>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="font-medium text-green-600">All Systems Operational</span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <SystemStatusCard key={item.name} name={item.name} status={item.status} color={item.color} />
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="w-full rounded-lg bg-steel-blue px-6 py-3 font-medium text-white hover:bg-opacity-90"
        >
          View Detailed Status Page
        </button>
      </div>
    </div>
  )
}
