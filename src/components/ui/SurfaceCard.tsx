import { cn } from "@/lib/utils"

interface SurfaceCardProps {
  variant?: "elevated" | "flat" | "subtle"
  className?: string
  children: React.ReactNode
}

const variantStyles: Record<NonNullable<SurfaceCardProps["variant"]>, string> = {
  elevated: "bg-white rounded-2xl shadow-lg",
  flat: "bg-white rounded-2xl border border-gray-200",
  subtle: "bg-gray-50 rounded-2xl",
}

export default function SurfaceCard({ variant = "elevated", className, children }: SurfaceCardProps) {
  return <div className={cn(variantStyles[variant], className)}>{children}</div>
}
