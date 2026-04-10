import categoriesData from "@/data/categories.json"
import suppliersData from "@/data/suppliers.json"
import trendingProducts from "@/data/trending-products.json"
import HomeBuyLaneSection from "@/features/home/components/home-page/HomeBuyLaneSection"
import HomeCategoriesSection from "@/features/home/components/home-page/HomeCategoriesSection"
import HomeFinalCtaSection from "@/features/home/components/home-page/HomeFinalCtaSection"
import HomeHeroSectionClient from "@/features/home/components/home-page/HomeHeroSection.client"
import HomeSignalRail from "@/features/home/components/home-page/HomeSignalRail"
import HomeSuppliersSection from "@/features/home/components/home-page/HomeSuppliersSection"
import HomeTrendingProductsSection from "@/features/home/components/home-page/HomeTrendingProductsSection"
import { homeBuyLaneItems, homeSignalItems } from "@/features/home/homePageData"
import type { HomeCategoryItem, HomeProductItem, HomeSupplierItem } from "@/features/home/types"

export default function HomePage() {
  const featuredCategories: ReadonlyArray<HomeCategoryItem> = categoriesData
  const featuredProducts: ReadonlyArray<HomeProductItem> = trendingProducts.slice(0, 4)
  const featuredSuppliers: ReadonlyArray<HomeSupplierItem> = suppliersData.slice(0, 3)

  return (
    <main className="relative isolate overflow-hidden bg-canvas">
      <div aria-hidden className="home-nebula pointer-events-none absolute inset-0" />
      <div aria-hidden className="home-grid-fade pointer-events-none absolute inset-0 opacity-60" />
      <HomeHeroSectionClient />
      <HomeSignalRail items={homeSignalItems} />
      <HomeCategoriesSection categories={featuredCategories} />
      <HomeTrendingProductsSection products={featuredProducts} />
      <HomeSuppliersSection suppliers={featuredSuppliers} />
      <HomeBuyLaneSection items={homeBuyLaneItems} />
      <HomeFinalCtaSection />
    </main>
  )
}
