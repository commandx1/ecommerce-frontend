import { Box, CheckCircle } from "lucide-react"

const PACKAGING_ITEMS = [
  {
    title: "Industry-Standard Materials",
    description: "Corrugated boxes, bubble wrap, foam inserts, and protective padding",
  },
  { title: "Fragile Item Handling", description: "Special care for delicate dental instruments and equipment" },
  {
    title: "Temperature Control",
    description: "Cold chain packaging for temperature-sensitive products when required",
  },
  { title: "Proper Labeling", description: "Clear handling instructions and hazard warnings where applicable" },
  { title: "Sustainability", description: "Recyclable and eco-friendly packaging materials whenever possible" },
] as const

export default function ProfessionalPackagingCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8">
      <div className="mb-6 flex items-center">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface sm:h-14 sm:w-14">
          <Box className="h-6 w-6 text-inverse-foreground sm:h-8 sm:w-8" />
        </div>
        <h3 className="text-xl font-bold text-text-primary sm:text-2xl">Professional Packaging</h3>
      </div>
      <div className="space-y-4">
        {PACKAGING_ITEMS.map((item) => (
          <div key={item.title} className="flex items-start">
            <CheckCircle className="mr-3 mt-1 h-5 w-5 shrink-0 text-success sm:h-6 sm:w-6" />
            <div>
              <h4 className="mb-1 text-sm font-semibold text-text-primary sm:text-base">{item.title}</h4>
              <p className="text-xs text-text-secondary sm:text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
