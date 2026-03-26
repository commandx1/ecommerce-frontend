"use client"

import { useEffect } from "react"
import { showToast } from "@/components/ui/Toast"

interface ProductErrorProps {
  message?: string
}

export default function ProductError({ message }: ProductErrorProps) {
  useEffect(() => {
    if (message) {
      showToast.error(message)
    }
  }, [message])

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-mint-gray">
      <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Error</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-steel-blue mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">{message || "The product you're looking for doesn't exist."}</p>
        <a
          href="/"
          className="inline-block bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}
