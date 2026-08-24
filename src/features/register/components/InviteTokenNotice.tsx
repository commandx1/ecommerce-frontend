import Link from "next/link"

interface InviteTokenNoticeProps {
  message?: string | null
}

const DEFAULT_MESSAGE = "This invitation link is no longer valid. Please ask the person who invited you for a new one."

export default function InviteTokenNotice({ message }: InviteTokenNoticeProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-2xl border border-danger/35 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--danger)_10%,var(--surface)),var(--surface))] shadow-lg shadow-danger/10 duration-500">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-danger" />

      <div className="flex flex-col gap-4 p-5 pl-7 sm:flex-row sm:gap-5 sm:p-6 sm:pl-8">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-danger/12 text-danger ring-4 ring-danger/10"
        >
          <svg
            role="img"
            aria-label="Warning"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-danger uppercase">Invitation link problem</p>
          <h2 className="mt-1.5 text-xl font-semibold text-text-primary">We couldn&apos;t verify this invitation</h2>
          <p className="mt-2 text-text-secondary">{message ?? DEFAULT_MESSAGE}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
            >
              Go to login
            </Link>
          </div>

          <p className="mt-5 border-t border-danger/20 pt-4 text-sm text-text-secondary">
            Still stuck? Please send an email to our customer support.{" "}
            <a
              href="mailto:infodentypro@gmail.com"
              className="font-medium text-brand underline underline-offset-4 transition-colors hover:text-brand-strong"
            >
              infodentypro@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
