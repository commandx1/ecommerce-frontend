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
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Stripe publishable key is missing. Please set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable card payments.
      </div>
    </SurfaceCard>
  )
}
