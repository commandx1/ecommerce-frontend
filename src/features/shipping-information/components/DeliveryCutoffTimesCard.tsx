import { Clock } from "lucide-react"

const CUT_OFF_WINDOWS = [
  {
    title: "Uber Direct Orders",
    value: "2:00 PM Local",
    description: "Orders placed before 2 PM qualify for same-day delivery",
  },
  {
    title: "Standard Shippo Orders",
    value: "4:00 PM EST",
    description: "Next business day dispatch guaranteed",
  },
] as const

export default function DeliveryCutoffTimesCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-brand-surface p-6 text-inverse-foreground sm:rounded-2xl sm:p-8">
      <div className="mb-4 flex items-center">
        <Clock className="mr-4 h-8 w-8 text-accent-strong sm:h-10 sm:w-10" />
        <h3 className="text-xl font-bold sm:text-2xl">Same-Day Cut-Off Times</h3>
      </div>
      <div className="space-y-4">
        {CUT_OFF_WINDOWS.map((window) => (
          <div key={window.title} className="rounded-lg border border-inverse-muted/20 bg-brand/20 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold sm:text-base">{window.title}</span>
              <span className="text-base font-bold text-accent-strong sm:text-lg">{window.value}</span>
            </div>
            <p className="text-xs text-inverse-muted sm:text-sm">{window.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
