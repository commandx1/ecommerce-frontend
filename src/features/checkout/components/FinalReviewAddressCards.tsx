import type { BillingAddress, ShippingAddress } from "@/stores/checkoutStore"

interface FinalReviewAddressCardsProps {
  billingAddress: BillingAddress
  shippingAddress: ShippingAddress
}

function AddressBlock({
  city,
  company,
  firstName,
  lastName,
  phone,
  state,
  street,
  zipCode,
}: ShippingAddress | BillingAddress) {
  return (
    <>
      <div className="font-medium">
        {firstName} {lastName}
      </div>
      <div>{company}</div>
      <div>{street}</div>
      <div>
        {city}, {state} {zipCode}
      </div>
      <div>{phone}</div>
    </>
  )
}

export default function FinalReviewAddressCards({ billingAddress, shippingAddress }: FinalReviewAddressCardsProps) {
  return (
    <>
      <div className="rounded-xl border border-border-soft bg-surface p-6">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">Shipping Address</h3>
        <div className="text-sm text-text-secondary">
          <AddressBlock {...shippingAddress} />
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-surface p-6">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">Billing Address</h3>
        <div className="text-sm text-text-secondary">
          {billingAddress.sameAsShipping ? <div>Same as shipping address</div> : <AddressBlock {...billingAddress} />}
        </div>
      </div>
    </>
  )
}
