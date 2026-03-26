import PageSectionContainer from "@/components/layout/PageSectionContainer"
import HeroContent from "@/features/home/components/HeroContent"
import HeroVisual from "@/features/home/components/HeroVisual"

export default function HeroSection() {
  return (
    <section className="bg-linear-to-br from-steel-blue to-blue-800 py-8 flex items-center">
      <PageSectionContainer as="div" containerClassName="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <HeroContent />
          <HeroVisual />
        </div>
      </PageSectionContainer>
    </section>
  )
}
