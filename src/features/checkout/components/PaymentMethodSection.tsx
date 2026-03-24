import { CreditCard, FileText, TrendingUp, University } from "lucide-react"
import type { PaymentMethodOption } from "@/features/checkout/types"
import type { PaymentMethod } from "@/stores/checkoutStore"

interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod
  paymentOptions: PaymentMethodOption[]
  updatePaymentMethod: (method: Partial<PaymentMethod>) => void
}

function PaymentMethodIcon({ icon }: { icon: PaymentMethodOption["icon"] }) {
  if (icon === "card") return <CreditCard className="text-steel-blue w-5 h-5 mr-3" />
  if (icon === "file") return <FileText className="text-steel-blue w-5 h-5 mr-3" />
  if (icon === "bank") return <University className="text-steel-blue w-5 h-5 mr-3" />
  return <TrendingUp className="text-steel-blue w-5 h-5 mr-3" />
}

export default function PaymentMethodSection({
  paymentMethod,
  paymentOptions,
  updatePaymentMethod,
}: PaymentMethodSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h3>
      <div className="space-y-4">
        {paymentOptions.map((option) => (
          <label
            key={option.type}
            className={`flex items-center border rounded-xl p-4 transition-colors cursor-pointer ${
              paymentMethod.type === option.type
                ? "border-steel-blue bg-light-mint-gray"
                : "border-gray-300 hover:border-steel-blue"
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              value={option.type}
              checked={paymentMethod.type === option.type}
              onChange={() => updatePaymentMethod({ type: option.type })}
              className="w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center">
                <PaymentMethodIcon icon={option.icon} />
                <span className="font-medium text-gray-900">{option.title}</span>
                {option.badge ? (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${option.badge.className}`}>
                    {option.badge.label}
                  </span>
                ) : null}
              </div>
              {option.description ? <div className="text-sm text-gray-600 mt-1 ml-8">{option.description}</div> : null}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
