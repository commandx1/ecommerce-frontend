import PageSectionContainer from "@/components/layout/PageSectionContainer"
import bannersData from "@/data/promotional-banners.json"
import PromotionalBannerCard from "./PromotionalBannerCard"

const PromotionalBanners = () => {
  return (
    <section className="py-16 bg-gray-50">
      <PageSectionContainer as="div">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bannersData.map((banner) => (
            <PromotionalBannerCard key={banner.id} {...banner} />
          ))}
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default PromotionalBanners
