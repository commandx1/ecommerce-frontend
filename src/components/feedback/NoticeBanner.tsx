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
  info: "bg-blue-50 border-blue-200 text-blue-900",
  success: "bg-green-50 border-green-200 text-green-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  error: "bg-red-50 border-red-200 text-red-900",
}

const iconMap: Record<NoticeTone, ReactNode> = {
  info: <Info className="mt-0.5 h-5 w-5 shrink-0" />,
  success: <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />,
  warning: <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />,
  error: <CircleX className="mt-0.5 h-5 w-5 shrink-0" />,
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
          {description ? <p className="text-sm opacity-90">{description}</p> : null}
          {children}
        </div>
      </div>
    </div>
  )
}
