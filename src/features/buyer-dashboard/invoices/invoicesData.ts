export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Disputed"

export interface BuyerInvoice {
  id: string
  supplier: string
  issueDate: string
  dueDate: string
  itemsSummary: string
  paymentMethod: string
  amount: number
  status: InvoiceStatus
  statusNote: string
}

export const buyerInvoices: ReadonlyArray<BuyerInvoice> = [
  {
    id: "INV-2026-0156",
    supplier: "DentalPro Supply",
    issueDate: "2026-04-10",
    dueDate: "2026-04-30",
    itemsSummary: "Composite Resin Kit, Surgical Instruments",
    paymentMethod: "Credit Card •••• 4532",
    amount: 1247.85,
    status: "Paid",
    statusNote: "Paid on Apr 26",
  },
  {
    id: "INV-2026-0155",
    supplier: "MediCore Equipment",
    issueDate: "2026-04-07",
    dueDate: "2026-05-06",
    itemsSummary: "Digital X-Ray Sensor, Intraoral Camera",
    paymentMethod: "Net 30 Terms",
    amount: 8950,
    status: "Pending",
    statusNote: "Due in 5 days",
  },
  {
    id: "INV-2026-0154",
    supplier: "OrthoTech Solutions",
    issueDate: "2026-03-30",
    dueDate: "2026-04-24",
    itemsSummary: "Orthodontic Brackets, Archwires",
    paymentMethod: "Credit Card •••• 4532",
    amount: 542.3,
    status: "Overdue",
    statusNote: "7 days overdue",
  },
  {
    id: "INV-2026-0153",
    supplier: "DentalPro Supply",
    issueDate: "2026-03-28",
    dueDate: "2026-04-25",
    itemsSummary: "Gloves, Face Masks, Sterilization Pouches",
    paymentMethod: "Bank Transfer",
    amount: 389.45,
    status: "Paid",
    statusNote: "Paid on Apr 20",
  },
  {
    id: "INV-2026-0152",
    supplier: "Advanced Dental Systems",
    issueDate: "2026-03-24",
    dueDate: "2026-04-20",
    itemsSummary: "Dental Chair Unit, LED Light",
    paymentMethod: "Financing Plan",
    amount: 15750,
    status: "Disputed",
    statusNote: "Under review",
  },
  {
    id: "INV-2026-0151",
    supplier: "Precision Dental Lab",
    issueDate: "2026-03-20",
    dueDate: "2026-05-13",
    itemsSummary: "Custom Crowns, Impression Materials",
    paymentMethod: "Net 30 Terms",
    amount: 2345,
    status: "Pending",
    statusNote: "Due in 12 days",
  },
  {
    id: "INV-2026-0150",
    supplier: "Global Dental Resources",
    issueDate: "2026-03-16",
    dueDate: "2026-04-15",
    itemsSummary: "Restorative Materials, Adhesives",
    paymentMethod: "ACH Transfer",
    amount: 1189.9,
    status: "Paid",
    statusNote: "Paid on Apr 12",
  },
  {
    id: "INV-2026-0149",
    supplier: "NextGen Dental Tech",
    issueDate: "2026-03-13",
    dueDate: "2026-04-10",
    itemsSummary: "Scanner Subscription, Cloud Analytics",
    paymentMethod: "Corporate Card •••• 9012",
    amount: 2690,
    status: "Overdue",
    statusNote: "21 days overdue",
  },
  {
    id: "INV-2026-0148",
    supplier: "SmileTech Solutions",
    issueDate: "2026-03-07",
    dueDate: "2026-04-06",
    itemsSummary: "Intraoral Camera Accessories",
    paymentMethod: "Credit Card •••• 4532",
    amount: 799,
    status: "Pending",
    statusNote: "Due in 2 days",
  },
  {
    id: "INV-2026-0147",
    supplier: "Apex Dental Distributors",
    issueDate: "2026-03-04",
    dueDate: "2026-04-01",
    itemsSummary: "Local Anesthetics, Needles",
    paymentMethod: "Bank Transfer",
    amount: 465.4,
    status: "Paid",
    statusNote: "Paid on Mar 30",
  },
]
