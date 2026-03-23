const POPULAR_TOPICS = ["Order Status", "Returns", "Account Setup", "Billing"]

const HelpCenterPopularTopics = () => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <span className="text-sm text-gray-600">Popular topics:</span>
      {POPULAR_TOPICS.map((topic, index) => (
        <span key={topic} className="flex items-center gap-2">
          <button type="button" className="text-sm text-steel-blue hover:underline">
            {topic}
          </button>
          {index < POPULAR_TOPICS.length - 1 ? <span className="text-gray-300">•</span> : null}
        </span>
      ))}
    </div>
  )
}

export default HelpCenterPopularTopics
