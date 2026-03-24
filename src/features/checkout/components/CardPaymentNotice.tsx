interface CardPaymentNoticeProps {
  isVisible: boolean
}

export default function CardPaymentNotice({ isVisible }: CardPaymentNoticeProps) {
  if (!isVisible) return null

  return (
    <div className="p-6 bg-light-mint-gray rounded-xl">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">Card Information</h4>
      <p className="text-sm text-gray-600">
        Card details will be entered securely using Stripe in the next step. We do not collect or store your card
        information on our servers.
      </p>
    </div>
  )
}
