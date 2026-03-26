import PageSectionContainer from "@/components/layout/PageSectionContainer"
import testimonialsData from "@/data/testimonials.json"
import SectionHeader from "@/features/home/components/SectionHeader"
import TestimonialCard from "@/features/home/components/TestimonialCard"

export default function Testimonials() {
  return (
    <section className="py-16 bg-white">
      <PageSectionContainer as="div">
        <div className="mb-16">
          <SectionHeader
            title="What Dental Professionals Say"
            description="Join thousands of satisfied dental professionals who trust DentyPro for their supply needs"
            align="center"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial) => (
            <TestimonialCard key={testimonial.id} {...testimonial} />
          ))}
        </div>
      </PageSectionContainer>
    </section>
  )
}
