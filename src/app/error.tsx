"use client"

import { useEffect } from "react"

/**
 * Root error boundary: without it a throwing Server Component left an empty content region with no
 * message. Carries an <h1> so the one-h1-per-page a11y contract holds on the error screen.
 */
interface RootErrorContentProps {
  error: Error & { digest?: string }
  reset: () => void
  /** Where "Back to Home" points and what it reads - overridden by callers that render this
   *  inside a nested boundary (e.g. the dashboards' own error.tsx) so the link stays in-context
   *  instead of always bouncing out to "/". */
  homeHref?: string
  homeLabel?: string
}

/** The card itself, shared with global-error.tsx and the dashboard error boundaries (same visuals and logging). */
export function RootErrorContent({ error, reset, homeHref = "/", homeLabel = "Back to Home" }: RootErrorContentProps) {
  useEffect(() => {
    // An error boundary that swallows its error is how the blank-page failure stayed invisible;
    // the digest is the only handle on the server-side stack once this is in production.
    console.error("[app] unhandled error", error.digest ?? "", error)
  }, [error])

  return (
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
        This page could not be loaded. Trying again often fixes it - the problem is usually temporary.
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
          href={homeHref}
          className="rounded-full border border-border-strong px-6 py-3 font-medium text-text-primary transition-colors hover:bg-surface-muted"
        >
          {homeLabel}
        </a>
      </div>
    </div>
  )
}

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center bg-canvas px-6 py-36">
      <RootErrorContent error={error} reset={reset} />
    </div>
  )
}
