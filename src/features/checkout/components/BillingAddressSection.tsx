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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
      <div className="space-y-4">
        <label
          className={`flex items-start border rounded-xl p-4 transition-colors cursor-pointer ${
            !showDifferentBilling ? "border-steel-blue bg-light-mint-gray" : "border-gray-300 hover:border-steel-blue"
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
            className="mt-1 w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
          />
          <div className="ml-4 flex-1">
            <div className="font-medium text-gray-900">Same as shipping address</div>
            <div className="text-sm text-gray-600 mt-1">
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
          className={`flex items-start border rounded-xl p-4 transition-colors cursor-pointer ${
            showDifferentBilling ? "border-steel-blue bg-light-mint-gray" : "border-gray-300 hover:border-steel-blue"
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
            className="mt-1 w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
          />
          <div className="ml-4 flex-1">
            <div className="font-medium text-gray-900">Use a different billing address</div>
            <div className="text-sm text-gray-600 mt-1">Enter a different address for billing purposes</div>
          </div>
        </label>
      </div>
    </div>
  )
}
