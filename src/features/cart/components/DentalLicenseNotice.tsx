import Link from "next/link"
import NotificationCard from "@/components/feedback/NotificationCard"
import type { DentalLicenseStatus } from "@/lib/helpers/dentalLicense"

interface DentalLicenseNoticeProps {
  licenseCheckFailed: boolean
  licenseStatus: DentalLicenseStatus | null
  licenseRejectionReason: string | null
  className?: string
}

/**
 * The single license-block message, shared by the cart page's summary panel and checkout's
 * license guard: same copy, same links, so a buyer sees one consistent explanation no matter
 * where the block was raised.
 */
export default function DentalLicenseNotice({
  licenseCheckFailed,
  licenseStatus,
  licenseRejectionReason,
  className = "mb-4 rounded-lg px-3 py-2",
}: DentalLicenseNoticeProps) {
  if (licenseCheckFailed) {
    // The licence service itself failed, so we do not know whether this buyer has one.
    // Checkout stays blocked (fail-closed), but pointing an already-licensed buyer at the
    // settings page would send them somewhere that looks correct and explains nothing.
    return (
      <NotificationCard
        tone="warning"
        title="Couldn't verify your dental license"
        description="One or more items in your cart require an approved dental license, and we couldn't check yours just now. Please try again in a moment."
        className={className}
      />
    )
  }

  if (licenseStatus === "pending") {
    return (
      <NotificationCard
        tone="warning"
        title="License awaiting approval"
        description="One or more items in your cart require an approved dental license. Yours is under review — checkout unlocks as soon as it's approved."
        className={className}
      >
        <Link
          href="/buyer-dashboard/settings#licenses"
          className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
        >
          View your license
        </Link>
      </NotificationCard>
    )
  }

  if (licenseStatus === "expired") {
    return (
      <NotificationCard
        tone="warning"
        title="Your dental license expired"
        description="One or more items in your cart require a valid dental license. Renew yours to continue."
        className={className}
      >
        <Link
          href="/buyer-dashboard/settings#licenses"
          className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
        >
          Renew your license
        </Link>
      </NotificationCard>
    )
  }

  if (licenseStatus === "rejected") {
    return (
      <NotificationCard
        tone="warning"
        title="Your dental license wasn't approved"
        description="One or more items in your cart require an approved dental license."
        className={className}
      >
        {/* Admin-authored free text: rendered as plain text, never as HTML. */}
        {licenseRejectionReason ? (
          <p className="mt-1 text-sm text-text-secondary">Reason: {licenseRejectionReason}</p>
        ) : null}
        <Link
          href="/buyer-dashboard/settings#licenses"
          className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
        >
          Update your license
        </Link>
      </NotificationCard>
    )
  }

  // "missing" (no license on file at all).
  return (
    <NotificationCard
      tone="warning"
      title="Dental license required"
      description="One or more items in your cart require a valid, approved dental license."
      className={className}
    >
      <Link
        href="/buyer-dashboard/settings#licenses"
        className="mt-1 inline-block text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
      >
        Add your license
      </Link>
    </NotificationCard>
  )
}
