import { Fragment } from "react/jsx-runtime"
import FeaturedSuppliers from "./components/featured-suppliers/FeaturedSuppliers"
import Footer from "./components/footer"
import HeroSection from "./components/hero-section/HeroSection"
import NewsletterResources from "./components/newsletter-resources/NewsletterResources"
import ProductCategories from "./components/product-categories/ProductCategories"
import Testimonials from "./components/testimonials/Testimonials"
import TrendingProducts from "./components/trending-products/TrendingProducts"
import TrustIndicators from "./components/trust-indicators/TrustIndicators"

export default function Home() {
  return (
    <Fragment>
      <HeroSection />
      <TrustIndicators />
      <ProductCategories />
      <FeaturedSuppliers />
      <TrendingProducts />
      <Testimonials />
      <NewsletterResources />
    </Fragment>
  )
}
