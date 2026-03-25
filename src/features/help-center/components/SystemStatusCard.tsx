interface SystemStatusCardProps {
  name: string
  status: string
  color: "green" | "yellow"
}

const colorMap = {
  green: {
    dot: "bg-green-500",
    text: "text-green-600",
  },
  yellow: {
    dot: "bg-yellow-500",
    text: "text-yellow-600",
  },
}

const SystemStatusCard = ({ name, status, color }: SystemStatusCardProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${colorMap[color].dot}`} />
        <span className="font-medium text-gray-700">{name}</span>
      </div>
      <span className={`text-sm font-medium ${colorMap[color].text}`}>{status}</span>
    </div>
  )
}

export default SystemStatusCard
