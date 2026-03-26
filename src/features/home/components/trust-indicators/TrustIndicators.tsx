import PageSectionContainer from "@/components/layout/PageSectionContainer"

const TrustIndicators = () => {
  return (
    <section className="bg-white py-12">
      <PageSectionContainer as="div">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-steel-blue">10,000+</div>
            <div className="text-gray-600 mt-1">Dental Professionals</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-steel-blue">500+</div>
            <div className="text-gray-600 mt-1">Verified Suppliers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-steel-blue">50,000+</div>
            <div className="text-gray-600 mt-1">Products Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-steel-blue">99.8%</div>
            <div className="text-gray-600 mt-1">Customer Satisfaction</div>
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default TrustIndicators
