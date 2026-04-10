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
    <div className="flex py-36 items-center justify-center bg-canvas px-6">
      <div className="max-w-md rounded-[1.75rem] border border-border-soft bg-surface-elevated p-12 text-center shadow-panel">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/12">
          <svg className="h-10 w-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Error</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-semibold text-text-primary">Product Not Found</h1>
        <p className="mb-6 text-text-secondary">{message || "The product you're looking for doesn't exist."}</p>
        <a
          href="/"
          className="inline-block rounded-full bg-brand px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}
