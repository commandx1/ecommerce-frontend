"use client"

import { Check } from "lucide-react"
import { useCheckoutStore } from "@/stores/checkoutStore"

const CheckoutProgress = () => {
  const { currentStep } = useCheckoutStore()

  const steps = [
    { number: 1, title: "Cart Review", subtitle: "Items confirmed" },
    { number: 2, title: "Shipping Details", subtitle: "Address verified" },
    { number: 3, title: "Billing Information", subtitle: "Current step" },
    { number: 4, title: "Final Review", subtitle: "Pending" },
    { number: 5, title: "Order Confirmation", subtitle: "Pending" },
  ]

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4 md:space-x-8 overflow-x-auto">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.number
              const isCurrent = currentStep === step.number

              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`min-w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted || isCurrent ? "bg-steel-blue" : "bg-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="text-white w-5 h-5" />
                      ) : (
                        <span className={`text-sm font-semibold ${isCurrent ? "text-white" : "text-gray-500"}`}>
                          {step.number}
                        </span>
                      )}
                    </div>
                    <div className="ml-3 hidden md:block">
                      <div
                        className={`text-sm font-medium ${
                          isCurrent || isCompleted ? "text-steel-blue" : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className={`text-xs ${isCurrent ? "text-gray-500" : "text-gray-400"}`}>
                        {isCurrent ? step.subtitle : isCompleted ? "Completed" : step.subtitle}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${isCompleted ? "bg-steel-blue" : "bg-gray-300"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CheckoutProgress
