import vendorMarketingData from "@/data/vendor-marketing.json"

const MarketingPerformance = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Marketing Performance</h2>
        <button type="button" className="bg-pale-lime text-steel-blue px-3 py-1 rounded-lg text-sm hover:bg-opacity-90">
          Create Campaign
        </button>
      </div>

      <div className="space-y-6">
        {vendorMarketingData.campaigns.map((campaign) => {
          const statusColorMap: Record<string, string> = {
            blue: "bg-blue-500",
            green: "bg-green-500",
            yellow: "bg-yellow-500",
          }

          return (
            <div
              key={campaign.id}
              className={`p-4 bg-linear-to-r ${campaign.gradient} rounded-xl border ${campaign.borderColor}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-steel-blue">{campaign.name}</h3>
                <span className={`text-xs ${statusColorMap[campaign.statusColor]} text-white px-2 py-1 rounded-full`}>
                  {campaign.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {campaign.impressions && (
                  <>
                    <div>
                      <div className="text-gray-600">Impressions</div>
                      <div className="font-semibold text-steel-blue">{campaign.impressions}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Clicks</div>
                      <div className="font-semibold text-steel-blue">{campaign.clicks}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">CTR</div>
                      <div className="font-semibold text-steel-blue">{campaign.ctr}</div>
                    </div>
                  </>
                )}
                {campaign.reach && (
                  <>
                    <div>
                      <div className="text-gray-600">Reach</div>
                      <div className="font-semibold text-steel-blue">{campaign.reach}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Conversions</div>
                      <div className="font-semibold text-steel-blue">{campaign.conversions}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">ROAS</div>
                      <div className="font-semibold text-steel-blue">{campaign.roas}</div>
                    </div>
                  </>
                )}
                {campaign.subscribers && (
                  <>
                    <div>
                      <div className="text-gray-600">Subscribers</div>
                      <div className="font-semibold text-steel-blue">{campaign.subscribers}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Open Rate</div>
                      <div className="font-semibold text-steel-blue">{campaign.openRate}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Click Rate</div>
                      <div className="font-semibold text-steel-blue">{campaign.clickRate}</div>
                    </div>
                  </>
                )}
              </div>
              {campaign.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Campaign Progress</span>
                    <span className="text-steel-blue font-medium">{campaign.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${statusColorMap[campaign.statusColor]} h-2 rounded-full`}
                      style={{ width: `${campaign.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MarketingPerformance
