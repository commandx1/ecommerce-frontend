import { AlertTriangle, CheckCircle2, CircleX, Info } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type NoticeTone = "info" | "success" | "warning" | "error"

interface NoticeBannerProps {
  tone?: NoticeTone
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  className?: string
  children?: ReactNode
}

const noticeStyleMap: Record<NoticeTone, string> = {
  info: "border-brand/20 bg-accent text-text-primary",
  success: "border-success/20 bg-success/10 text-text-primary",
  warning: "border-warning/20 bg-warning/10 text-text-primary",
  error: "border-danger/20 bg-danger/10 text-text-primary",
}

const iconMap: Record<NoticeTone, ReactNode> = {
  info: <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />,
  success: <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />,
  warning: <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />,
  error: <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-danger" />,
}

export default function NoticeBanner({
  tone = "info",
  title,
  description,
  icon,
  className,
  children,
}: NoticeBannerProps) {
  return (
    <div className={cn("rounded-xl border p-4", noticeStyleMap[tone], className)}>
      <div className="flex items-start gap-3">
        {icon ?? iconMap[tone]}
        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
          {children}
        </div>
      </div>
    </div>
  )
}
