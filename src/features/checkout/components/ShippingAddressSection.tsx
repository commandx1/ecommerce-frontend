import { MapPin, Pencil } from "lucide-react"
import SurfaceCard from "@/components/ui/SurfaceCard"
import type { Address } from "@/lib/api/address"
import AddressContactInfo from "./AddressContactInfo"

interface ShippingAddressSectionProps {
  addresses: Address[]
  isLoading: boolean
  selectedAddressId: string
  onAddAddress: () => void
}

export default function ShippingAddressSection({
  addresses,
  isLoading,
  selectedAddressId,
  onAddAddress,
}: ShippingAddressSectionProps) {
  // Buyers keep a single address (see `AddressManagementShared`'s `singleAddress` mode), so this
  // step reports where the order ships rather than asking. The id `useShippingDetails` already
  // resolved wins; the rest of the chain repeats its fallback for accounts whose older records
  // still hold more than one address.
  const shippingAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses.find((address) => address.defaultAddress) ??
    addresses[0] ??
    null

  return (
    <SurfaceCard variant="editorial" className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand">
            <span className="text-sm font-semibold text-white">2</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Shipping Address</h2>
        </div>
        {!isLoading && shippingAddress ? (
          <button
            type="button"
            onClick={onAddAddress}
            className="flex items-center text-sm font-medium text-brand hover:underline"
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit Address
          </button>
        ) : null}
      </div>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" /> : null}

      {!isLoading && !shippingAddress ? (
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

      {!isLoading && shippingAddress ? (
        <div className="max-w-xl rounded-2xl border border-border-soft bg-surface-elevated p-6">
          <AddressContactInfo
            title={shippingAddress.title}
            address={(shippingAddress.formattedAddress || shippingAddress.addressLine).replace(/,\s*USA\s*$/i, "")}
            phone={shippingAddress.phoneNumber}
          />
        </div>
      ) : null}
    </SurfaceCard>
  )
}
