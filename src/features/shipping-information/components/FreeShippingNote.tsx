import NoticeBanner from "@/components/feedback/NoticeBanner"

export default function FreeShippingNote() {
  return (
    <NoticeBanner
      tone="info"
      title="Free Shipping Threshold"
      description="Standard shipping is free on orders over $500 within the continental U.S."
      className="p-6"
    />
  )
}
