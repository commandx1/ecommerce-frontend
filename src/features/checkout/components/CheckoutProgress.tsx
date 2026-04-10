"use client"

import { Check } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import type { CheckoutProgressStep } from "@/features/checkout/types"

interface CheckoutProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5
}

const CHECKOUT_STEPS: CheckoutProgressStep[] = [
  { number: 1, title: "Cart Review", subtitle: "Items confirmed" },
  { number: 2, title: "Shipping Details", subtitle: "Address verified" },
  { number: 3, title: "Billing Information", subtitle: "Current step" },
  { number: 4, title: "Final Review", subtitle: "Pending" },
  { number: 5, title: "Order Confirmation", subtitle: "Pending" },
]

function CheckoutProgressItem({
  currentStep,
  isLast,
  step,
}: {
  currentStep: number
  isLast: boolean
  step: CheckoutProgressStep
}) {
  const isCompleted = currentStep > step.number
  const isCurrent = currentStep === step.number

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        <div
          className={`flex h-10 min-w-10 items-center justify-center rounded-full ${
            isCompleted || isCurrent ? "bg-brand" : "bg-surface-muted"
          }`}
        >
          {isCompleted ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <span className={`text-sm font-semibold ${isCurrent ? "text-white" : "text-text-muted"}`}>
              {step.number}
            </span>
          )}
        </div>
        <div className="ml-3 hidden md:block">
          <div className={`text-sm font-medium ${isCurrent || isCompleted ? "text-brand" : "text-text-muted"}`}>
            {step.title}
          </div>
          <div className={`text-xs ${isCurrent ? "text-text-secondary" : "text-text-muted"}`}>
            {isCurrent ? step.subtitle : isCompleted ? "Completed" : step.subtitle}
          </div>
        </div>
      </div>

      {!isLast ? <div className={`mx-2 h-0.5 w-8 md:w-16 ${isCompleted ? "bg-brand" : "bg-border-soft"}`} /> : null}
    </div>
  )
}

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <PageSectionContainer as="section" className="border-b border-border-soft bg-surface" containerClassName="py-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center overflow-x-auto rounded-full border border-border-soft bg-surface-elevated px-4 py-4 shadow-soft md:space-x-8">
          {CHECKOUT_STEPS.map((step, index) => (
            <CheckoutProgressItem
              key={step.number}
              currentStep={currentStep}
              isLast={index === CHECKOUT_STEPS.length - 1}
              step={step}
            />
          ))}
        </div>
      </div>
    </PageSectionContainer>
  )
}
