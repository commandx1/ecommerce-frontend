import PageSectionContainer from "@/components/layout/PageSectionContainer"
import CategoryCard from "@/features/home/components/CategoryCard"
import { getFeaturedCategoryAsset } from "@/features/home/data/featured-category-assets"
import type { FeaturedCategory } from "@/features/home/lib/select-featured-categories"

interface HomeCategoriesSectionProps {
  categories: ReadonlyArray<FeaturedCategory>
}

export default function HomeCategoriesSection({ categories }: HomeCategoriesSectionProps) {
  return (
    <PageSectionContainer as="section" className="relative py-6 lg:py-18">
      <h2 className="max-w-[20ch] m-auto text-center font-display text-4xl leading-[1.03] text-text-primary md:text-5xl">
        Shop by category, not by confusion.
      </h2>
      <p className="mt-4 max-w-[60ch] m-auto text-center text-base leading-relaxed text-text-secondary">
        We bring high-intent categories to the front so clinics can go from discovery to order faster.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category, index) => {
          const { thumb } = getFeaturedCategoryAsset(category.name)
          const description = category.topChildren.join(", ")

          return (
            <div key={category.name} className="h-full">
              <CategoryCard
                title={category.name}
                description={description}
                productCount={category.count.toLocaleString("en-US")}
                image={thumb}
                priority={index < 4}
                accent={index === 0}
                eyebrow={index === 0 ? "Most stocked" : "Category"}
                href={`/products?categories=${encodeURIComponent(category.name)}`}
              />
            </div>
          )
        })}
      </div>
    </PageSectionContainer>
  )
}
