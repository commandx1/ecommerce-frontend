import { ArrowRight } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import suppliersData from "@/data/suppliers.json"
import SectionHeader from "@/features/home/components/SectionHeader"
import SupplierCard from "@/features/home/components/SupplierCard"

export default function FeaturedSuppliers() {
  return (
    <section className="py-16 bg-white">
      <PageSectionContainer as="div">
        <div className="mb-12">
          <SectionHeader
            title="Featured Suppliers"
            description="Partner with industry-leading suppliers who provide quality products and exceptional service to dental professionals nationwide."
            align="center"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {suppliersData.map((supplier) => (
            <SupplierCard key={supplier.id} {...supplier} />
          ))}
        </div>
        <div className="text-center mt-12">
          <button
            type="button"
            className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold flex items-center mx-auto"
          >
            View All Suppliers
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </PageSectionContainer>
    </section>
  )
}
