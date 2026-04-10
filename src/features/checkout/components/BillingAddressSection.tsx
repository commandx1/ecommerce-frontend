import type { ShippingAddress } from "@/stores/checkoutStore"

interface BillingAddressSectionProps {
  shippingAddress: ShippingAddress
  showDifferentBilling: boolean
  setBillingSameAsShipping: (same: boolean) => void
  setShowDifferentBilling: (value: boolean) => void
}

export default function BillingAddressSection({
  shippingAddress,
  showDifferentBilling,
  setBillingSameAsShipping,
  setShowDifferentBilling,
}: BillingAddressSectionProps) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Billing Address</h3>
      <div className="space-y-4">
        <label
          className={`flex cursor-pointer items-start rounded-xl border p-4 transition-colors ${
            !showDifferentBilling
              ? "border-brand bg-accent"
              : "border-border-soft bg-surface-elevated hover:border-brand"
          }`}
        >
          <input
            type="radio"
            name="billing-address"
            value="same"
            checked={!showDifferentBilling}
            onChange={() => {
              setShowDifferentBilling(false)
              setBillingSameAsShipping(true)
            }}
            className="mt-1 h-5 w-5 border-border-strong text-brand focus:ring-brand"
          />
          <div className="ml-4 flex-1">
            <div className="font-medium text-text-primary">Same as shipping address</div>
            <div className="mt-1 text-sm text-text-secondary">
              {shippingAddress.firstName} {shippingAddress.lastName}
              <br />
              {shippingAddress.company}
              <br />
              {shippingAddress.street}
              <br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              <br />
              {shippingAddress.phone}
            </div>
          </div>
        </label>

        <label
          className={`flex cursor-pointer items-start rounded-xl border p-4 transition-colors ${
            showDifferentBilling
              ? "border-brand bg-accent"
              : "border-border-soft bg-surface-elevated hover:border-brand"
          }`}
        >
          <input
            type="radio"
            name="billing-address"
            value="different"
            checked={showDifferentBilling}
            onChange={() => {
              setShowDifferentBilling(true)
              setBillingSameAsShipping(false)
            }}
            className="mt-1 h-5 w-5 border-border-strong text-brand focus:ring-brand"
          />
          <div className="ml-4 flex-1">
            <div className="font-medium text-text-primary">Use a different billing address</div>
            <div className="mt-1 text-sm text-text-secondary">Enter a different address for billing purposes</div>
          </div>
        </label>
      </div>
    </div>
  )
}
