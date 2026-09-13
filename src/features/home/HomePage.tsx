import suppliersData from "@/data/suppliers.json"
import trendingProducts from "@/data/trending-products.json"
import HomeBuyLaneSection from "@/features/home/components/home-page/HomeBuyLaneSection"
import HomeCategoriesSection from "@/features/home/components/home-page/HomeCategoriesSection"
import HomeFinalCtaSection from "@/features/home/components/home-page/HomeFinalCtaSection"
import HomeHeroSectionClient from "@/features/home/components/home-page/HomeHeroSection.client"
import HomeSuppliersSection from "@/features/home/components/home-page/HomeSuppliersSection"
import HomeTrendingProductsSection from "@/features/home/components/home-page/HomeTrendingProductsSection"
import { homeBuyLaneItems } from "@/features/home/homePageData"
import type { FeaturedCategory } from "@/features/home/lib/select-featured-categories"
import type { HomeProductItem, HomeSupplierItem } from "@/features/home/types"

interface HomePageProps {
  featuredCategories: ReadonlyArray<FeaturedCategory>
}

export default function HomePage({ featuredCategories }: HomePageProps) {
  const featuredProducts: ReadonlyArray<HomeProductItem> = trendingProducts.slice(0, 4)
  const featuredSuppliers: ReadonlyArray<HomeSupplierItem> = suppliersData.slice(0, 3)

  return (
    <main className="relative isolate bg-canvas">
      {/* Visually hidden - the hero below is an image carousel with no
          visible page title, and the section headings that follow (h2)
          are per-section, not page-level. Screen reader / a11y-scan
          users still need exactly one <h1> describing the page. */}
      <h1 className="sr-only">DentyPro — B2B dental supply marketplace</h1>
      {/* overflow-hidden scoped only to decorative hero section so sticky cards can work below */}
      <div className="relative overflow-hidden">
        <div aria-hidden className="home-nebula pointer-events-none absolute inset-0" />
        <div aria-hidden className="home-grid-fade pointer-events-none absolute inset-0 opacity-60" />
        <HomeHeroSectionClient />
      </div>

      {featuredCategories.length > 0 && <HomeCategoriesSection categories={featuredCategories} />}
      <HomeTrendingProductsSection products={featuredProducts} />
      <HomeSuppliersSection suppliers={featuredSuppliers} />
      <HomeBuyLaneSection items={homeBuyLaneItems} />
      <HomeFinalCtaSection />
    </main>
  )
}
