import SurfaceCard from "@/components/ui/SurfaceCard"
import type { BuyerInvoice } from "../invoicesData"
import InvoiceCard from "./InvoiceCard"

export default function InvoiceList({
  invoices,
  selectedInvoiceIds,
  onToggleSelect,
}: {
  invoices: BuyerInvoice[]
  selectedInvoiceIds: Set<string>
  onToggleSelect: (invoiceId: string) => void
}) {
  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          selected={selectedInvoiceIds.has(invoice.id)}
          onToggleSelect={() => onToggleSelect(invoice.id)}
        />
      ))}
      {invoices.length === 0 ? (
        <SurfaceCard variant="glass" className="p-6 text-sm text-text-secondary">
          No invoices match the selected filters.
        </SurfaceCard>
      ) : null}
    </div>
  )
}
