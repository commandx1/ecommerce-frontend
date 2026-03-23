import HeroContent from "@/features/home/components/HeroContent"
import HeroVisual from "@/features/home/components/HeroVisual"

export default function HeroSection() {
  return (
    <section id="hero-section" className="bg-linear-to-br from-steel-blue to-blue-800 py-8 flex items-center">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <HeroContent />
          <HeroVisual />
        </div>
      </div>
    </section>
  )
}
