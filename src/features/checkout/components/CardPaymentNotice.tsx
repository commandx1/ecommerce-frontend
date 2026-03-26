import NoticeBanner from "@/components/feedback/NoticeBanner"

interface CardPaymentNoticeProps {
  isVisible: boolean
}

export default function CardPaymentNotice({ isVisible }: CardPaymentNoticeProps) {
  if (!isVisible) return null

  return (
    <NoticeBanner
      tone="info"
      title="Card Information"
      description="Card details will be entered securely using Stripe in the next step. We do not collect or store your card information on our servers."
      className="p-6"
    />
  )
}
