import PageSectionContainer from "@/components/layout/PageSectionContainer"

const INDICATORS = [
  { value: "10,000+", label: "Dental Professionals" },
  { value: "500+", label: "Verified Suppliers" },
  { value: "50,000+", label: "Products Available" },
  { value: "99.8%", label: "Customer Satisfaction" },
]

export default function TrustIndicators() {
  return (
    <section className="bg-white py-12">
      <PageSectionContainer as="div">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {INDICATORS.map((indicator) => (
            <div key={indicator.label} className="text-center">
              <div className="text-3xl font-bold text-steel-blue">{indicator.value}</div>
              <div className="text-gray-600 mt-1">{indicator.label}</div>
            </div>
          ))}
        </div>
      </PageSectionContainer>
    </section>
  )
}
