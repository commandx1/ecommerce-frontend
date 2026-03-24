import CheckoutProgress from "@/features/checkout/components/CheckoutProgress"
import CheckoutStepContent from "@/features/checkout/components/CheckoutStepContent"
import OrderSummary from "@/features/checkout/components/OrderSummary"

interface CheckoutLayoutProps {
  currentStep: 1 | 2 | 3 | 4 | 5
  showOrderSummary: boolean
  view: "shipping" | "billing" | "review" | "confirmation" | "empty"
}

export default function CheckoutLayout({ currentStep, showOrderSummary, view }: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen bg-light-mint-gray">
      <CheckoutProgress currentStep={currentStep} />
      <section className="py-8">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 lg:w-2/3">
              <CheckoutStepContent view={view} />
            </div>
            {showOrderSummary ? (
              <div className="lg:w-1/3">
                <OrderSummary />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
