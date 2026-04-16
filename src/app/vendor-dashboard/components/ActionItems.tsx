import vendorActionItemsData from "@/data/vendor-action-items.json"
import { cn } from "@/lib/utils"
import DashboardPanel from "./shared/DashboardPanel"

const priorityColorMap: Record<string, string> = {
  "coral-orange": "text-coral-orange",
  yellow: "text-warning",
  green: "text-success",
}

const ActionItems = () => {
  return (
    <DashboardPanel
      title="Action Items"
      className="lg:col-span-2"
      action={
        <span className="text-sm text-text-secondary">
          {vendorActionItemsData.items.filter((item) => !item.completed).length} pending tasks
        </span>
      }
    >
      <div className="space-y-4">
        {vendorActionItemsData.items.map((item) => {
          const priorityColor = priorityColorMap[item.priorityColor] || "text-text-secondary"

          return (
            <div
              key={item.id}
              className="flex items-center rounded-xl border border-border-soft bg-surface-muted/70 p-4"
            >
              <input
                type="checkbox"
                checked={item.completed}
                readOnly
                className="mr-4 h-4 w-4 rounded border-border-strong bg-surface-elevated text-brand accent-brand"
              />
              <div className="flex-1">
                <div
                  className={cn("font-medium", item.completed ? "line-through text-text-muted" : "text-text-primary")}
                >
                  {item.title}
                </div>
                <div className={cn("text-sm", item.completed ? "text-text-muted" : "text-text-secondary")}>
                  {item.description}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm ${priorityColor} font-medium`}>{item.priority}</div>
                <div className="text-xs text-text-muted">{item.dueDate}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-xs text-text-secondary">
        Focus first on items tagged as critical impact to prevent order flow delays.
      </div>
    </DashboardPanel>
  )
}

export default ActionItems
