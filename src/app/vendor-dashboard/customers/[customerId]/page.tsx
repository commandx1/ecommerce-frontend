import { notFound } from "next/navigation"
import { getCustomerById } from "@/features/vendor-dashboard/customers/lib/customers-data"
import VendorCustomerDetailPage from "@/features/vendor-dashboard/customers/VendorCustomerDetailPage"

interface PageProps {
  params: Promise<{
    customerId: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { customerId } = await params
  const customer = getCustomerById(customerId)

  if (!customer) {
    notFound()
  }

  return <VendorCustomerDetailPage customer={customer} />
}
