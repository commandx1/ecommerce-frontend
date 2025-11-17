import { Expand } from "lucide-react"
import vendorGeographicData from "@/data/vendor-geographic.json"

const colorMap: Record<string, string> = {
  "steel-blue": "bg-steel-blue",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  gray: "bg-gray-400",
}

const GeographicDistribution = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Geographic Distribution</h2>
        <button type="button" className="text-steel-blue hover:text-opacity-80">
          <Expand className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        {vendorGeographicData.regions.map((region) => {
          const dotColor = colorMap[region.color] || "bg-gray-400"
          const barColor = colorMap[region.color] || "bg-gray-400"

          return (
            <div key={region.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${dotColor} rounded-full mr-3`}></div>
                <span className="text-sm font-medium">{region.name}</span>
              </div>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className={`${barColor} h-2 rounded-full`}
                    style={{ width: `${region.percentage * 3.57}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-steel-blue">{region.percentage}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-light-mint-gray rounded-xl">
        <div className="text-sm font-medium text-steel-blue mb-2">Top Growth Markets</div>
        <div className="space-y-2">
          {vendorGeographicData.growthMarkets.map((market) => (
            <div key={market.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{market.name}</span>
              <span className="text-green-600 font-medium">{market.growth}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GeographicDistribution
