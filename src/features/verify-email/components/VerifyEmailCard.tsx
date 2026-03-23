import type { ReactNode } from "react"

interface VerifyEmailCardProps {
  children: ReactNode
}

export default function VerifyEmailCard({ children }: VerifyEmailCardProps) {
  return <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12">{children}</div>
}
