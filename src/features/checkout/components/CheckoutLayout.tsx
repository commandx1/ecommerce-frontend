import PageSectionContainer from "@/components/layout/PageSectionContainer"
import CheckoutProgress from "@/features/checkout/components/CheckoutProgress"
import CheckoutStepContent from "@/features/checkout/components/CheckoutStepContent"
import OrderSummary from "@/features/checkout/components/OrderSummary"
import type { CheckoutLicenseWarning } from "@/features/checkout/hooks/useCheckoutPage"

interface CheckoutLayoutProps {
  currentStep: 1 | 2 | 3 | 4 | 5
  showOrderSummary: boolean
  view: "shipping" | "billing" | "review" | "confirmation" | "empty"
  licenseWarning: CheckoutLicenseWarning | null
}

export default function CheckoutLayout({ currentStep, showOrderSummary, view, licenseWarning }: CheckoutLayoutProps) {
  return (
    <div className="bg-canvas" style={{ minHeight: "70vh" }}>
      <CheckoutProgress currentStep={currentStep} />
      <PageSectionContainer as="section" className="py-8 md:py-10">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 lg:w-2/3">
            <CheckoutStepContent view={view} licenseWarning={licenseWarning} />
          </div>
          {showOrderSummary ? (
            <div className="lg:w-1/3">
              <OrderSummary />
            </div>
          ) : null}
        </div>
      </PageSectionContainer>
    </div>
  )
}
