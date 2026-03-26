import NoticeBanner from "@/components/feedback/NoticeBanner"
import SurfaceCard from "@/components/ui/SurfaceCard"

export default function FinalReviewUnavailable() {
  return (
    <SurfaceCard className="mb-8 p-8">
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
          <span className="text-white text-sm font-semibold">4</span>
        </div>
        <h2 className="text-2xl font-bold text-steel-blue">Final Review</h2>
      </div>
      <NoticeBanner
        tone="error"
        description="Stripe publishable key is missing. Please set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable card payments."
      />
    </SurfaceCard>
  )
}
