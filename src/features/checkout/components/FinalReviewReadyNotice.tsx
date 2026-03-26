import NoticeBanner from "@/components/feedback/NoticeBanner"

export default function FinalReviewReadyNotice() {
  return (
    <NoticeBanner
      tone="success"
      title="Ready to Place Order"
      description="Please review all information above. Once you place your order, you will receive a confirmation email."
      className="mb-8 p-6"
    />
  )
}
