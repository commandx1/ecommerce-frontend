import NoticeBanner from "@/components/feedback/NoticeBanner"

const TIPS = [
  "Include screenshots or photos when relevant",
  "Provide your order number for order-related issues",
  "Be specific about error messages or unexpected behavior",
  "Mention your browser/device if experiencing website issues",
]

const TicketTipsCard = () => {
  return (
    <NoticeBanner tone="info" title="Tips for faster resolution:" className="rounded-lg">
      <ul className="mt-1 space-y-1 text-sm text-blue-800">
        {TIPS.map((tip) => (
          <li key={tip}>• {tip}</li>
        ))}
      </ul>
    </NoticeBanner>
  )
}

export default TicketTipsCard
