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
      <div className="p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
        <div className="text-sm text-gray-600">
          <AddressBlock {...shippingAddress} />
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
        <div className="text-sm text-gray-600">
          {billingAddress.sameAsShipping ? <div>Same as shipping address</div> : <AddressBlock {...billingAddress} />}
        </div>
      </div>
    </>
  )
}
