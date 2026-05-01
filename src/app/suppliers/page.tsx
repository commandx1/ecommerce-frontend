import type { Metadata } from "next"
import SuppliersPage from "@/features/suppliers/SuppliersPage"

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Browse trusted and verified dental suppliers across categories.",
}

export default function SuppliersRoutePage() {
  return <SuppliersPage />
}
