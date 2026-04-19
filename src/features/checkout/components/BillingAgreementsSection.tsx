import Link from "next/link"
import { useId } from "react"

interface BillingAgreementsSectionProps {
  termsAgreed: boolean
  setTermsAgreed: (value: boolean) => void
}

export default function BillingAgreementsSection({
  termsAgreed,
  setTermsAgreed,
}: BillingAgreementsSectionProps) {
  const id = useId()

  return (
    <div className="rounded-xl border border-border-soft bg-surface p-6">
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            id={`${id}-terms`}
            type="checkbox"
            checked={termsAgreed}
            onChange={(event) => setTermsAgreed(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
          />
          <label htmlFor={`${id}-terms`} className="ml-3 text-sm text-text-secondary">
            I agree to the{" "}
            <Link href="/legal" className="font-medium text-brand hover:underline">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/legal" className="font-medium text-brand hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>
      </div>
    </div>
  )
}
