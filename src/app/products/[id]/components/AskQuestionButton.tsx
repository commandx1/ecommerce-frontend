"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import AskQuestionModal from "./AskQuestionModal"

interface UserProduct {
  id: string
  vendor: string
}

interface AskQuestionButtonProps {
  productId: string
  userProducts: UserProduct[]
}

export default function AskQuestionButton({ productId, userProducts }: AskQuestionButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = () => {
    // Refresh the page to show the new question
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
      >
        Ask a Question
      </button>

      <AskQuestionModal
        productId={productId}
        userProducts={userProducts}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

