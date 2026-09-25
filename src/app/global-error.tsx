"use client"

import "./globals.css"
import { RootErrorContent } from "./error"

/**
 * Mounted only when the root layout itself throws, so it renders its own <html>/<body> and cannot
 * rely on any provider from layout.tsx - it stays self-contained apart from the global stylesheet
 * and the shared RootErrorContent card.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-36">
          <RootErrorContent error={error} reset={reset} />
        </div>
      </body>
    </html>
  )
}
