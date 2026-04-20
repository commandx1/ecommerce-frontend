import { Check, MapPin, Plus } from "lucide-react"
import SurfaceCard from "@/components/ui/SurfaceCard"
import type { Address } from "@/lib/api/address"
import AddressContactInfo from "./AddressContactInfo"

interface ShippingAddressSectionProps {
  addresses: Address[]
  isLoading: boolean
  selectedAddressId: string
  onAddAddress: () => void
  onSelectAddress: (address: Address) => void
}

export default function ShippingAddressSection({
  addresses,
  isLoading,
  selectedAddressId,
  onAddAddress,
  onSelectAddress,
}: ShippingAddressSectionProps) {
  return (
    <SurfaceCard variant="editorial" className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand">
            <span className="text-sm font-semibold text-white">2</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Select Shipping Address</h2>
        </div>
        <button
          type="button"
          onClick={onAddAddress}
          className="flex items-center text-sm font-medium text-brand hover:underline"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add New Address
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 rounded-xl bg-surface-muted" />
          <div className="h-24 rounded-xl bg-surface-muted" />
        </div>
      ) : null}

      {!isLoading && addresses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border-soft bg-surface-muted px-6 py-12 text-center">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-text-muted" />
          <p className="mb-6 text-text-secondary">No addresses found in your account.</p>
          <button
            type="button"
            onClick={onAddAddress}
            className="rounded-full bg-brand px-6 py-2 font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            Add Your First Address
          </button>
        </div>
      ) : null}

      {!isLoading && addresses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((address) => {
            const displayAddress = (address.formattedAddress || address.addressLine).replace(/,\s*USA\s*$/i, "")

            return (
              <label
                key={address.id}
                className={`relative cursor-pointer rounded-2xl border p-6 transition-all hover:border-brand/50 ${
                  selectedAddressId === address.id
                    ? "border-brand bg-accent ring-1 ring-brand/25"
                    : "border-border-soft bg-surface-elevated"
                }`}
              >
                <input
                  type="radio"
                  name="shippingAddress"
                  className="sr-only"
                  checked={selectedAddressId === address.id}
                  onChange={() => onSelectAddress(address)}
                />
                <div className="flex items-start justify-between">
                  <AddressContactInfo title={address.title} address={displayAddress} phone={address.phoneNumber} />
                  {selectedAddressId === address.id ? (
                    <div className="rounded-full bg-brand p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : null}
                </div>
              </label>
            )
          })}
        </div>
      ) : null}
    </SurfaceCard>
  )
}
