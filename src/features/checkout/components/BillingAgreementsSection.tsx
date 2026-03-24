import Link from "next/link"
import { useId } from "react"

interface BillingAgreementsSectionProps {
  hipaaAgreed: boolean
  marketingAgreed: boolean
  termsAgreed: boolean
  setHipaaAgreed: (value: boolean) => void
  setMarketingAgreed: (value: boolean) => void
  setTermsAgreed: (value: boolean) => void
}

export default function BillingAgreementsSection({
  hipaaAgreed,
  marketingAgreed,
  termsAgreed,
  setHipaaAgreed,
  setMarketingAgreed,
  setTermsAgreed,
}: BillingAgreementsSectionProps) {
  const id = useId()

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            id={`${id}-terms`}
            type="checkbox"
            checked={termsAgreed}
            onChange={(event) => setTermsAgreed(event.target.checked)}
            className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded mt-1"
          />
          <label htmlFor={`${id}-terms`} className="ml-3 text-sm text-gray-700">
            I agree to the{" "}
            <Link href="/legal" className="text-steel-blue hover:underline font-medium">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/legal" className="text-steel-blue hover:underline font-medium">
              Privacy Policy
            </Link>
          </label>
        </div>

        <div className="flex items-start">
          <input
            id={`${id}-marketing`}
            type="checkbox"
            checked={marketingAgreed}
            onChange={(event) => setMarketingAgreed(event.target.checked)}
            className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded mt-1"
          />
          <label htmlFor={`${id}-marketing`} className="ml-3 text-sm text-gray-700">
            I would like to receive promotional emails about new products and special offers
          </label>
        </div>

        <div className="flex items-start">
          <input
            id={`${id}-hipaa`}
            type="checkbox"
            checked={hipaaAgreed}
            onChange={(event) => setHipaaAgreed(event.target.checked)}
            className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded mt-1"
          />
          <label htmlFor={`${id}-hipaa`} className="ml-3 text-sm text-gray-700">
            I acknowledge the{" "}
            <Link href="/legal" className="text-steel-blue hover:underline font-medium">
              HIPAA compliance notice
            </Link>{" "}
            for healthcare-related purchases
          </label>
        </div>
      </div>
    </div>
  )
}
