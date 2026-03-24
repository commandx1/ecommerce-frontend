import { useId } from "react"
import type { BillingAddress } from "@/stores/checkoutStore"

interface BillingAddressFormProps {
  billingAddress: BillingAddress
  updateBillingAddress: (address: Partial<BillingAddress>) => void
}

const STATE_OPTIONS = [
  { label: "California", value: "CA" },
  { label: "New York", value: "NY" },
  { label: "Texas", value: "TX" },
  { label: "Florida", value: "FL" },
]

export default function BillingAddressForm({ billingAddress, updateBillingAddress }: BillingAddressFormProps) {
  const id = useId()

  return (
    <div className="p-6 bg-light-mint-gray rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor={`${id}-first-name`} className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            id={`${id}-first-name`}
            type="text"
            required
            value={billingAddress.firstName}
            onChange={(event) => updateBillingAddress({ firstName: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter first name"
          />
        </div>
        <div>
          <label htmlFor={`${id}-last-name`} className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            id={`${id}-last-name`}
            type="text"
            required
            value={billingAddress.lastName}
            onChange={(event) => updateBillingAddress({ lastName: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter last name"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-company`} className="block text-sm font-medium text-gray-700 mb-2">
            Company/Practice Name
          </label>
          <input
            id={`${id}-company`}
            type="text"
            value={billingAddress.company}
            onChange={(event) => updateBillingAddress({ company: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter company name"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-street`} className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            id={`${id}-street`}
            type="text"
            required
            value={billingAddress.street}
            onChange={(event) => updateBillingAddress({ street: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter street address"
          />
        </div>
        <div>
          <label htmlFor={`${id}-city`} className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            id={`${id}-city`}
            type="text"
            required
            value={billingAddress.city}
            onChange={(event) => updateBillingAddress({ city: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter city"
          />
        </div>
        <div>
          <label htmlFor={`${id}-state`} className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <select
            id={`${id}-state`}
            required
            value={billingAddress.state}
            onChange={(event) => updateBillingAddress({ state: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
          >
            <option value="">Select state</option>
            {STATE_OPTIONS.map((stateOption) => (
              <option key={stateOption.value} value={stateOption.value}>
                {stateOption.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-zip`} className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code *
          </label>
          <input
            id={`${id}-zip`}
            type="text"
            required
            value={billingAddress.zipCode}
            onChange={(event) => updateBillingAddress({ zipCode: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="Enter ZIP code"
          />
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            id={`${id}-phone`}
            type="tel"
            value={billingAddress.phone}
            onChange={(event) => updateBillingAddress({ phone: event.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
    </div>
  )
}
