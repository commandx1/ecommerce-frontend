"use client"

import { useEffect } from "react"

/**
 * Root error boundary. Until this existed the app had none at all - 46 routes, zero `error.tsx` -
 * so anything a Server Component threw left the visitor with the header and footer and a
 * completely empty content region, with no message and nothing to click. That failure mode was
 * captured on /products/[id]: a 280-line DOM snapshot holding only `banner` and `contentinfo`.
 *
 * This is purely additive - it renders only when something below the root layout throws - and it
 * carries an <h1> so the "exactly one h1 per page" contract the a11y smoke spec enforces still
 * holds on the error screen. Mirrors ProductError's card so a failure looks like the rest of the
 * app rather than an unstyled fallback.
 */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // An error boundary that swallows its error is how the blank-page failure stayed invisible;
    // the digest is the only handle on the server-side stack once this is in production.
    // biome-ignore lint/suspicious/noConsole: deliberate - this is the app's only error report
    console.error("[app] unhandled error", error.digest ?? "", error)
  }, [error])

  return (
    <div className="flex items-center justify-center bg-canvas px-6 py-36">
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
        <h1 className="mb-4 text-2xl font-semibold text-text-primary">Something went wrong</h1>
        <p className="mb-6 text-text-secondary">
          This page could not be loaded. Trying again often fixes it - the problem is usually
          temporary.
        </p>
        {error.digest ? <p className="mb-6 font-mono text-xs text-text-muted">Reference: {error.digest}</p> : null}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-brand px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-border-strong px-6 py-3 font-medium text-text-primary transition-colors hover:bg-surface-muted"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
