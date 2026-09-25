interface CustomerRevenueTrendProps {
  monthlyRevenue: number[]
}

export default function CustomerRevenueTrend({ monthlyRevenue }: CustomerRevenueTrendProps) {
  const maxValue = Math.max(...monthlyRevenue)
  const periods = ["M1", "M2", "M3", "M4", "M5", "M6"]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2">
        {periods.map((period, index) => {
          const value = monthlyRevenue[index] ?? 0

          return (
            <div key={period} className="space-y-1 text-center">
              <div className="flex h-28 items-end justify-center rounded-lg border border-border-soft bg-surface-muted/70 p-1">
                <div
                  className="w-full rounded-md bg-brand"
                  style={{ height: `${Math.max(12, (value / maxValue) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-text-secondary">{period}</div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-text-secondary">Monthly spend trend over last 6 periods</p>
    </div>
  )
}
