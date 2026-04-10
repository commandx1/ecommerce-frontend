import { useId } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    <div className="rounded-xl border border-border-soft bg-surface p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-first-name`} className="mb-2 block text-sm font-medium text-text-secondary">
            First Name *
          </label>
          <input
            id={`${id}-first-name`}
            type="text"
            required
            value={billingAddress.firstName}
            onChange={(event) => updateBillingAddress({ firstName: event.target.value })}
            className="w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter first name"
          />
        </div>
        <div>
          <label htmlFor={`${id}-last-name`} className="mb-2 block text-sm font-medium text-text-secondary">
            Last Name *
          </label>
          <input
            id={`${id}-last-name`}
            type="text"
            required
            value={billingAddress.lastName}
            onChange={(event) => updateBillingAddress({ lastName: event.target.value })}
            className="w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter last name"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-company`} className="mb-2 block text-sm font-medium text-text-secondary">
            Company/Practice Name
          </label>
          <input
            id={`${id}-company`}
            type="text"
            value={billingAddress.company}
            onChange={(event) => updateBillingAddress({ company: event.target.value })}
            className="w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter company name"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-street`} className="mb-2 block text-sm font-medium text-text-secondary">
            Street Address *
          </label>
          <input
            id={`${id}-street`}
            type="text"
            required
            value={billingAddress.street}
            onChange={(event) => updateBillingAddress({ street: event.target.value })}
            className="w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter street address"
          />
        </div>
        <div>
          <label htmlFor={`${id}-city`} className="mb-2 block text-sm font-medium text-text-secondary">
            City *
          </label>
          <input
            id={`${id}-city`}
            type="text"
            required
            value={billingAddress.city}
            onChange={(event) => updateBillingAddress({ city: event.target.value })}
            className="w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter city"
          />
        </div>
        <div>
          <label htmlFor={`${id}-state`} className="mb-2 block text-sm font-medium text-text-secondary">
            State *
          </label>
          <Select
            name="state"
            required
            value={billingAddress.state}
            onValueChange={(value) => updateBillingAddress({ state: value })}
          >
            <SelectTrigger id={`${id}-state`} className="w-full rounded-lg">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATE_OPTIONS.map((stateOption) => (
                <SelectItem key={stateOption.value} value={stateOption.value}>
                  {stateOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor={`${id}-zip`} className="mb-2 block text-sm font-medium text-text-secondary">
            ZIP Code *
          </label>
          <input
            id={`${id}-zip`}
            type="text"
            required
            value={billingAddress.zipCode}
            onChange={(event) => updateBillingAddress({ zipCode: event.target.value })}
            className="w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Enter ZIP code"
          />
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="mb-2 block text-sm font-medium text-text-secondary">
            Phone Number
          </label>
          <input
            id={`${id}-phone`}
            type="tel"
            value={billingAddress.phone}
            onChange={(event) => updateBillingAddress({ phone: event.target.value })}
            className="w-full rounded-lg border border-border-soft bg-surface-elevated px-4 py-3 text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
    </div>
  )
}
