import SurfaceCard from "@/components/ui/SurfaceCard"
import { Skeleton } from "@/components/ui/skeleton"

export interface ReviewKpi {
  label: string
  value: string
  hint: string
}

interface ReviewKpiCardsProps {
  kpis: ReviewKpi[]
  loading: boolean
}

export default function ReviewKpiCards({ kpis, loading }: ReviewKpiCardsProps) {
  return (
    <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <SurfaceCard key={kpi.label} variant="glass" className="p-5">
          <div className="text-sm text-text-secondary">{kpi.label}</div>
          <div className="mt-2 text-2xl font-bold text-text-primary">
            {loading ? <Skeleton className="inline-block h-7 w-12 rounded" /> : kpi.value}
          </div>
          <div className="mt-1 text-xs text-text-muted">{kpi.hint}</div>
        </SurfaceCard>
      ))}
    </section>
  )
}
