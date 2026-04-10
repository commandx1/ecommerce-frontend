const POPULAR_TOPICS = ["Order Status", "Returns", "Account Setup", "Billing"]

const HelpCenterPopularTopics = () => {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-inverse-muted">Popular topics:</span>
      {POPULAR_TOPICS.map((topic, index) => (
        <span key={topic} className="flex items-center gap-2">
          <button type="button" className="text-sm text-inverse-foreground/90 hover:underline">
            {topic}
          </button>
          {index < POPULAR_TOPICS.length - 1 ? <span className="text-inverse-muted/70">•</span> : null}
        </span>
      ))}
    </div>
  )
}

export default HelpCenterPopularTopics
