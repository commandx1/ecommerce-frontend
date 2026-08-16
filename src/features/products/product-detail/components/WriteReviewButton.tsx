"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import WriteReviewModal from "./WriteReviewModal"

interface WriteReviewButtonProps {
  productId: string
  userProductId?: string
  vendorName?: string
}

export default function WriteReviewButton({ productId, userProductId, vendorName }: WriteReviewButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = () => {
    // Refresh the page to show the new review
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
      >
        Write a Review
      </button>

      <WriteReviewModal
        productId={productId}
        userProductId={userProductId}
        vendorName={vendorName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
