"use client"

import "./globals.css"
import { RootErrorContent } from "./error"

/**
 * Next only mounts this when something throws above (or within) the root layout itself - the
 * one place `app/error.tsx` cannot catch, since that boundary lives inside the layout it would
 * need to replace. Because of that this has to render its own <html>/<body> and cannot lean on
 * any provider from layout.tsx (ThemeProvider, QueryProvider, StripeConfigProvider, ...) - none
 * of them are mounted at this point, so this stays deliberately self-contained and only pulls in
 * the global stylesheet plus the shared RootErrorContent card (same visuals, same digest logging
 * as the root boundary) rather than duplicating either.
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
