import bannersData from "@/data/promotional-banners.json"
import PromotionalBannerCard from "./PromotionalBannerCard"

const PromotionalBanners = () => {
  return (
    <section id="promotional-banners" className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bannersData.map((banner) => (
            <PromotionalBannerCard key={banner.id} {...banner} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default PromotionalBanners
