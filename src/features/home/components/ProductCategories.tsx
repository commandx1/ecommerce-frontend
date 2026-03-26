import PageSectionContainer from "@/components/layout/PageSectionContainer"
import categoriesData from "@/data/categories.json"
import CategoryCard from "@/features/home/components/CategoryCard"
import SectionHeader from "@/features/home/components/SectionHeader"

export default function ProductCategories() {
  return (
    <section className="py-16 bg-light-mint-gray">
      <PageSectionContainer as="div">
        <div className="mb-12">
          <SectionHeader
            title="Shop by Category"
            description="Explore our comprehensive range of dental supplies, equipment, and services tailored for modern dental practices."
            align="center"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesData.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </div>
      </PageSectionContainer>
    </section>
  )
}
