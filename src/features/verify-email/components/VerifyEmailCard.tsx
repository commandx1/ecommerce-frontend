import type { ReactNode } from "react"

interface VerifyEmailCardProps {
  children: ReactNode
}

export default function VerifyEmailCard({ children }: VerifyEmailCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-surface-elevated p-6 shadow-2xl sm:p-8 lg:p-12">{children}</div>
  )
}
