import vendorActionItemsData from "@/data/vendor-action-items.json"

const priorityColorMap: Record<string, string> = {
  "coral-orange": "text-coral-orange",
  yellow: "text-yellow-600",
  green: "text-green-600",
}

const ActionItems = () => {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Action Items</h2>
        <span className="text-sm text-gray-600">
          {vendorActionItemsData.items.filter((item) => !item.completed).length} pending tasks
        </span>
      </div>

      <div className="space-y-4">
        {vendorActionItemsData.items.map((item) => {
          const priorityColor = priorityColorMap[item.priorityColor] || "text-gray-600"

          return (
            <div key={item.id} className="flex items-center p-4 bg-light-mint-gray rounded-xl">
              <input
                type="checkbox"
                checked={item.completed}
                readOnly
                className="w-4 h-4 text-steel-blue bg-gray-100 border-gray-300 rounded focus:ring-steel-blue mr-4"
              />
              <div className="flex-1">
                <div className={`font-medium ${item.completed ? "text-gray-500 line-through" : "text-steel-blue"}`}>
                  {item.title}
                </div>
                <div className={`text-sm ${item.completed ? "text-gray-400" : "text-gray-600"}`}>
                  {item.description}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm ${priorityColor} font-medium`}>{item.priority}</div>
                <div className="text-xs text-gray-500">{item.dueDate}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ActionItems
