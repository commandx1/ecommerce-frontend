import NoticeBanner from "@/components/feedback/NoticeBanner"
import SurfaceCard from "@/components/ui/SurfaceCard"

export default function FinalReviewUnavailable() {
  return (
    <SurfaceCard variant="editorial" className="mb-8 p-8">
      <div className="mb-8 flex items-center">
        <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand">
          <span className="text-sm font-semibold text-white">4</span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Final Review</h2>
      </div>
      <NoticeBanner
        tone="error"
        description="Stripe publishable key is missing. Please set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable card payments."
      />
    </SurfaceCard>
  )
}
