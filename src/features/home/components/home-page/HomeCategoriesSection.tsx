import PageSectionContainer from "@/components/layout/PageSectionContainer"
import CategoryCard from "@/features/home/components/CategoryCard"
import type { HomeCategoryItem } from "@/features/home/types"

interface HomeCategoriesSectionProps {
  categories: ReadonlyArray<HomeCategoryItem>
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
        {categories.map((category, index) => (
          <div key={category.id} className="h-full">
            <CategoryCard
              {...category}
              eyebrow={index % 3 === 0 ? "Most Ordered" : index % 3 === 1 ? "Restock Core" : "Specialty Focus"}
              href={`/products?category=${encodeURIComponent(category.title)}`}
            />
          </div>
        ))}
      </div>
    </PageSectionContainer>
  )
}
