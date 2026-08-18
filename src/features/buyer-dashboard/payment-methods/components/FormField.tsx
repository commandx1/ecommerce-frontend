import type { ReactNode } from "react"

export default function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      {children}
    </div>
  )
}
