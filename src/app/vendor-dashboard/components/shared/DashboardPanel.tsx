import type { ReactNode } from "react"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { cn } from "@/lib/utils"

interface DashboardPanelProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  contentClassName?: string
  titleClassName?: string
  children: ReactNode
}

export default function DashboardPanel({
  title,
  description,
  action,
  className,
  contentClassName,
  titleClassName,
  children,
}: DashboardPanelProps) {
  return (
    <SurfaceCard variant="technical" className={cn("p-6", className)}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className={cn("text-xl font-semibold text-text-primary", titleClassName)}>{title}</h2>
          {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </SurfaceCard>
  )
}
