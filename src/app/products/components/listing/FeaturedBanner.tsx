import { Box } from "lucide-react"

const FeaturedBanner = () => {
  return (
    <div className="bg-linear-to-r from-steel-blue to-blue-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-2">Featured Surgical Kits</h3>
        <p className="text-blue-100 mb-6 max-w-lg">
          Complete instrument sets from top manufacturers. Save up to 20% on bundled purchases.
        </p>
        <button
          type="button"
          className="bg-pale-lime text-steel-blue px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
        >
          View Featured Kits
        </button>
      </div>
      <Box className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white/10 rotate-12" />
    </div>
  )
}

export default FeaturedBanner
