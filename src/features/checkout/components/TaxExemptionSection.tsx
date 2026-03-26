import { useId } from "react"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import ActionButton from "@/components/ui/ActionButton"

interface TaxExemptionSectionProps {
  applyTaxExemption: boolean
  setApplyTaxExemption: (value: boolean) => void
}

export default function TaxExemptionSection({ applyTaxExemption, setApplyTaxExemption }: TaxExemptionSectionProps) {
  const id = useId()

  return (
    <NoticeBanner
      tone="warning"
      title="Tax Exemption"
      description="As a registered dental practice, you may be eligible for tax exemption on certain medical supplies. Your tax exemption certificate is on file and will be applied automatically where applicable."
      className="p-6"
    >
      <div className="mt-4 flex items-center space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`${id}-apply-exemption`}
            checked={applyTaxExemption}
            onChange={(event) => setApplyTaxExemption(event.target.checked)}
            className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded"
          />
          <label htmlFor={`${id}-apply-exemption`} className="ml-2 text-sm font-medium text-yellow-700">
            Apply tax exemption where applicable
          </label>
        </div>
        <ActionButton type="button" intent="ghost" size="sm" className="text-sm font-medium">
          Update exemption certificate
        </ActionButton>
      </div>
    </NoticeBanner>
  )
}
