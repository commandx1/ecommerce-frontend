import ShippingMethodsTable from "@/features/shipping-information/components/ShippingMethodsTable"
import ShippingProviderCards from "@/features/shipping-information/components/ShippingProviderCards"

export default function ShippingMethodsComparison() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">Shipping Methods</h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the delivery solution that fits your operational requirements
          </p>
        </div>
        <ShippingMethodsTable />
        <ShippingProviderCards />
      </div>
    </section>
  )
}
