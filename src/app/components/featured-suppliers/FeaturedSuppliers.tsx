import { ArrowRight } from "lucide-react"
import suppliersData from "@/data/suppliers.json"
import SupplierCard from "./SupplierCard"

const FeaturedSuppliers = () => {
  return (
    <section id="featured-suppliers" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Featured Suppliers</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Partner with industry-leading suppliers who provide quality products and exceptional service to dental
            professionals nationwide.
          </p>
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
      </div>
    </section>
  )
}

export default FeaturedSuppliers
