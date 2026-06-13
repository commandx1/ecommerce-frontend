import type { Metadata } from "next"
import SuppliersPage from "@/features/suppliers/SuppliersPage"

export const metadata: Metadata = {
  title: "Vendors",
  description: "Browse trusted and verified dental vendors across categories.",
}

export default function VendorsRoutePage() {
  return <SuppliersPage />
}
