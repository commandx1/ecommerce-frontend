import { Info } from "lucide-react"
import { useId } from "react"

interface TaxExemptionSectionProps {
  applyTaxExemption: boolean
  setApplyTaxExemption: (value: boolean) => void
}

export default function TaxExemptionSection({ applyTaxExemption, setApplyTaxExemption }: TaxExemptionSectionProps) {
  const id = useId()

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
      <div className="flex items-start">
        <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-lg font-semibold text-yellow-800 mb-2">Tax Exemption</h4>
          <p className="text-sm text-yellow-700 mb-4">
            As a registered dental practice, you may be eligible for tax exemption on certain medical supplies. Your tax
            exemption certificate is on file and will be applied automatically where applicable.
          </p>
          <div className="flex items-center space-x-4">
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
            <button type="button" className="text-steel-blue hover:underline text-sm font-medium">
              Update exemption certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
