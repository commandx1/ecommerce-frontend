import { CreditCard, FileText, TrendingUp, University } from "lucide-react"
import type { PaymentMethodOption } from "@/features/checkout/types"
import type { PaymentMethod } from "@/stores/checkoutStore"

interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod
  paymentOptions: PaymentMethodOption[]
  updatePaymentMethod: (method: Partial<PaymentMethod>) => void
}

function PaymentMethodIcon({ icon }: { icon: PaymentMethodOption["icon"] }) {
  if (icon === "card") return <CreditCard className="mr-3 h-5 w-5 text-brand" />
  if (icon === "file") return <FileText className="mr-3 h-5 w-5 text-brand" />
  if (icon === "bank") return <University className="mr-3 h-5 w-5 text-brand" />
  return <TrendingUp className="mr-3 h-5 w-5 text-brand" />
}

export default function PaymentMethodSection({
  paymentMethod,
  paymentOptions,
  updatePaymentMethod,
}: PaymentMethodSectionProps) {
  return (
    <div>
      <h3 className="mb-6 text-lg font-semibold text-text-primary">Payment Method</h3>
      <div className="space-y-4">
        {paymentOptions.map((option) => (
          <label
            key={option.type}
            className={`flex cursor-pointer items-center rounded-xl border p-4 transition-colors ${
              paymentMethod.type === option.type
                ? "border-brand bg-accent"
                : "border-border-soft bg-surface-elevated hover:border-brand"
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              value={option.type}
              checked={paymentMethod.type === option.type}
              onChange={() => updatePaymentMethod({ type: option.type })}
              className="h-5 w-5 border-border-strong text-brand focus:ring-brand"
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center">
                <PaymentMethodIcon icon={option.icon} />
                <span className="font-medium text-text-primary">{option.title}</span>
                {option.badge ? (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${option.badge.className}`}>
                    {option.badge.label}
                  </span>
                ) : null}
              </div>
              {option.description ? (
                <div className="ml-8 mt-1 text-sm text-text-secondary">{option.description}</div>
              ) : null}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
