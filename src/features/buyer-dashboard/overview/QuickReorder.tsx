import { FlaskConical, Hospital, type LucideIcon, Scissors, ShieldCheck, Syringe } from "lucide-react"
import { Button } from "@/components/ui/button"
import dashboardOrdersData from "@/data/dashboard-orders.json"

const iconMap: Record<string, LucideIcon> = {
  tooth: Hospital,
  "shield-check": ShieldCheck,
  syringe: Syringe,
  cut: Scissors,
  flask: FlaskConical,
}

const QuickReorder = () => {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary">Quick Reorder</h2>
        <p className="mt-1 text-sm text-text-secondary">Frequently ordered items</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardOrdersData.quickReorder.map((item) => {
            const IconComponent = iconMap[item.icon]
            return (
              <div
                key={item.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border-soft p-3 transition-colors hover:bg-surface-muted/55"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted/70">
                    {IconComponent && <IconComponent className="h-5 w-5 text-brand" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">{item.title}</h4>
                    <p className="text-xs text-text-muted">Last ordered: {item.lastOrdered}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="unstyled"
                  className="rounded bg-brand px-3 py-1 text-xs text-primary-foreground transition-colors hover:bg-brand-strong"
                >
                  Reorder
                </Button>
              </div>
            )
          })}
        </div>

        <Button
          type="button"
          variant="unstyled"
          className="mt-4 w-full rounded-lg bg-accent-strong px-4 py-2 font-medium text-accent-foreground transition-colors hover:brightness-95"
        >
          View All Frequent Items
        </Button>
      </div>
    </div>
  )
}

export default QuickReorder
