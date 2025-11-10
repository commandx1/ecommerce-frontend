import stepsData from "@/data/how-it-works.json"
import StepCard from "./StepCard"

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">How DentyPro Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your dental practice procurement with our simple, secure, and efficient B2B marketplace
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stepsData.map((step) => (
            <StepCard key={step.id} {...step} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
