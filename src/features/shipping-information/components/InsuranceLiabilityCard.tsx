import { Shield } from "lucide-react"

const INSURANCE_BLOCKS = [
  {
    title: "Standard Coverage",
    main: "All shipments include basic carrier insurance up to $100 at no additional cost",
    note: "Covers loss or damage during transit",
  },
  {
    title: "Additional Insurance",
    main: "Optional enhanced coverage available for high-value orders during checkout",
    note: "Recommended for equipment and bulk orders over $1,000",
  },
  {
    title: "Signature Requirements",
    main: "Orders over $500 require signature upon delivery for security",
    note: "Ensures proper handoff and proof of delivery",
  },
] as const

export default function InsuranceLiabilityCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8">
      <div className="mb-6 flex items-center">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-coral-orange sm:h-14 sm:w-14">
          <Shield className="h-6 w-6 text-inverse-foreground sm:h-8 sm:w-8" />
        </div>
        <h3 className="text-xl font-bold text-text-primary sm:text-2xl">Insurance & Liability</h3>
      </div>
      <div className="space-y-4">
        {INSURANCE_BLOCKS.map((item) => (
          <div key={item.title} className="rounded-lg bg-surface-muted/60 p-4">
            <h4 className="mb-2 text-sm font-semibold text-text-primary sm:text-base">{item.title}</h4>
            <p className="mb-2 text-xs text-text-secondary sm:text-sm">{item.main}</p>
            <div className="text-xs text-text-muted">{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
