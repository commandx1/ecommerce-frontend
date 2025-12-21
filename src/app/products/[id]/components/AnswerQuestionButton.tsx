"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import AnswerQuestionModal from "./AnswerQuestionModal"

interface AnswerQuestionButtonProps {
  questionId: string
  questionText: string
}

export default function AnswerQuestionButton({ questionId, questionText }: AnswerQuestionButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = () => {
    // Refresh the page to show the new answer
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="text-steel-blue hover:text-opacity-80 font-medium transition-colors text-sm"
      >
        Answer
      </button>

      <AnswerQuestionModal
        questionId={questionId}
        questionText={questionText}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}

