import FeaturedSuppliers from "@/features/home/components/FeaturedSuppliers"
import HeroSection from "@/features/home/components/HeroSection"
import NewsletterResources from "@/features/home/components/NewsletterResources"
import ProductCategories from "@/features/home/components/ProductCategories"
import Testimonials from "@/features/home/components/Testimonials"
import TrendingProducts from "@/features/home/components/TrendingProducts"
import TrustIndicators from "@/features/home/components/TrustIndicators"

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrustIndicators />
      <ProductCategories />
      <FeaturedSuppliers />
      <TrendingProducts />
      <Testimonials />
      <NewsletterResources />
    </main>
  )
}
