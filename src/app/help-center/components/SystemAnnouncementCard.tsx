interface SystemAnnouncementCardProps {
  type: string
  dotColor: string
  date: string
  title: string
  description: string
}

const SystemAnnouncementCard = ({ type, dotColor, date, title, description }: SystemAnnouncementCardProps) => {
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${dotColor} rounded-full mt-2`} />
          <span className="font-semibold text-steel-blue">{type}</span>
        </div>
        <span className="text-sm text-gray-500">{date}</span>
      </div>
      <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

export default SystemAnnouncementCard
