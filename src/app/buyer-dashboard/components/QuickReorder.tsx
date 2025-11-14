import { FlaskConical, Hospital, type LucideIcon, Scissors, ShieldCheck, Syringe } from "lucide-react"
import dashboardOrdersData from "@/data/dashboard-orders.json"

const iconMap: Record<string, LucideIcon> = {
  tooth: Hospital,
  "shield-check": ShieldCheck,
  syringe: Syringe,
  cut: Scissors,
  flask: FlaskConical,
}

const QuickReorder = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-steel-blue">Quick Reorder</h2>
        <p className="text-sm text-gray-600 mt-1">Frequently ordered items</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardOrdersData.quickReorder.map((item) => {
            const IconComponent = iconMap[item.icon]
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-light-mint-gray transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-light-mint-gray rounded-lg flex items-center justify-center">
                    {IconComponent && <IconComponent className="text-steel-blue w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-steel-blue text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-500">Last ordered: {item.lastOrdered}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="bg-steel-blue text-white px-3 py-1 rounded text-xs hover:bg-opacity-90"
                >
                  Reorder
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          className="w-full mt-4 bg-pale-lime text-steel-blue py-2 px-4 rounded-lg hover:bg-opacity-90 font-medium"
        >
          View All Frequent Items
        </button>
      </div>
    </div>
  )
}

export default QuickReorder
