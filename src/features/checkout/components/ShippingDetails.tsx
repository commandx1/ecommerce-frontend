"use client"

import { ArrowRight } from "lucide-react"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import ActionButton from "@/components/ui/ActionButton"
import ShippingAddressSection from "@/features/checkout/components/ShippingAddressSection"
import ShippingMethodsSection from "@/features/checkout/components/ShippingMethodsSection"
import { useShippingDetails } from "@/features/checkout/hooks/useShippingDetails"

export default function ShippingDetails() {
  const {
    addresses,
    cartId,
    isLoadingAddresses,
    selectedAddressId,
    selectedRates,
    sellerGroups,
    showAutoOrderAddressNotice,
    onAddAddress,
    onAddressChange,
    onRateSelect,
    onSubmit,
  } = useShippingDetails()

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <ShippingAddressSection
        addresses={addresses}
        isLoading={isLoadingAddresses}
        selectedAddressId={selectedAddressId}
        onAddAddress={onAddAddress}
        onSelectAddress={onAddressChange}
      />

      {showAutoOrderAddressNotice ? (
        <NoticeBanner
          tone="warning"
          title="Repeat deliveries use your primary address"
          description="This order ships where you chose above, but future automatic re-orders always go to your primary address. Set this one as primary if that's where you want them."
        />
      ) : null}

      {selectedAddressId && cartId && Object.keys(sellerGroups).length > 0 ? (
        <ShippingMethodsSection
          addressId={selectedAddressId}
          cartId={cartId}
          selectedRates={selectedRates}
          sellerGroups={sellerGroups}
          onRateSelect={onRateSelect}
        />
      ) : null}

      <div className="flex items-center justify-end">
        <ActionButton
          type="submit"
          disabled={!selectedAddressId}
          size="lg"
          fullWidth={false}
          className="px-10 font-bold"
        >
          Continue to Billing
          <ArrowRight className="ml-2 w-6 h-6" />
        </ActionButton>
      </div>
    </form>
  )
}
