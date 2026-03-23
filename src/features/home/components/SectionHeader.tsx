import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  description?: string
  align?: "center" | "left"
  actions?: ReactNode
}

export default function SectionHeader({ title, description, align = "left", actions }: SectionHeaderProps) {
  const wrapperClassName = cn(
    align === "center" ? "text-center" : "",
    actions ? "flex items-start justify-between" : "",
  )

  return (
    <div className={wrapperClassName}>
      <div className={actions ? "max-w-2xl" : ""}>
        <h2 className="text-4xl font-bold text-steel-blue mb-4">{title}</h2>
        {description && <p className="text-xl text-gray-600">{description}</p>}
      </div>
      {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
    </div>
  )
}
