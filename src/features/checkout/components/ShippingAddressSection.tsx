import { Check, MapPin, Plus } from "lucide-react"
import SurfaceCard from "@/components/ui/SurfaceCard"
import type { Address } from "@/lib/api/address"

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
    <SurfaceCard className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-sm font-semibold">2</span>
          </div>
          <h2 className="text-2xl font-bold text-steel-blue">Select Shipping Address</h2>
        </div>
        <button
          type="button"
          onClick={onAddAddress}
          className="flex items-center text-steel-blue hover:underline text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add New Address
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
      ) : null}

      {!isLoading && addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-6">No addresses found in your account.</p>
          <button
            type="button"
            onClick={onAddAddress}
            className="px-6 py-2 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Add Your First Address
          </button>
        </div>
      ) : null}

      {!isLoading && addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`relative p-6 border rounded-2xl cursor-pointer transition-all hover:border-steel-blue/50 ${
                selectedAddressId === address.id
                  ? "border-steel-blue bg-blue-50/50 ring-1 ring-steel-blue"
                  : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="shippingAddress"
                className="sr-only"
                checked={selectedAddressId === address.id}
                onChange={() => onSelectAddress(address)}
              />
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{address.title}</h3>
                  <p className="text-sm text-gray-600 font-medium">{address.fullName}</p>
                  <div className="text-sm text-gray-500 mt-2 space-y-1">
                    <p>{address.formattedAddress || address.addressLine}</p>
                    <p>{address.phoneNumber}</p>
                  </div>
                </div>
                {selectedAddressId === address.id ? (
                  <div className="bg-steel-blue rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : null}
              </div>
            </label>
          ))}
        </div>
      ) : null}
    </SurfaceCard>
  )
}
