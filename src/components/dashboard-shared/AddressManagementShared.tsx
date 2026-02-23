"use client"

import { useAuthStore } from "@/stores/authStore"
import { Edit2, MapPin, Plus, Save, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import AddressAutocomplete from "@/app/register/components/AddressAutocomplete"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { addressAPI, type Address, type CreateAddressPayload, type UpdateAddressPayload } from "@/lib/api/address"
import ConfirmationModal from "@/app/components/ConfirmationModal"

export default function AddressManagementShared() {
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<Partial<Address> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Deletion modal state
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchAddresses = async () => {
    try {
      const data = await addressAPI.getAddresses()
      setAddresses(data)
    } catch (error) {
      toast.error("An error occurred while loading addresses")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const handleEdit = (address: Address) => {
    setCurrentAddress(address)
    setIsEditing(true)
  }

  const handleAddNew = () => {
    setCurrentAddress({
      title: "",
      fullName: `${user?.name || ""} ${user?.surname || ""}`.trim(),
      phoneNumber: user?.phoneNumber || "",
      defaultAddress: addresses.length === 0,
    })
    setIsEditing(true)
  }

  const confirmDelete = async () => {
    if (!addressToDelete) return

    setIsDeleting(true)
    try {
      await addressAPI.deleteAddress(addressToDelete)
      toast.success("Address deleted successfully")
      setAddressToDelete(null)
      fetchAddresses()
    } catch (error) {
      toast.error("An error occurred while deleting the address")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAddress) return

    if (!currentAddress.postalCode?.trim()) {
      toast.error("Zip code is required")
      return
    }

    setIsSaving(true)
    try {
      const isUpdate = !!currentAddress.id

      if (isUpdate) {
        await addressAPI.updateAddress(currentAddress.id!, currentAddress as UpdateAddressPayload)
      } else {
        await addressAPI.createAddress(currentAddress as CreateAddressPayload)
      }

      toast.success(isUpdate ? "Address updated" : "New address added")
      setIsEditing(false)
      setCurrentAddress(null)
      fetchAddresses()
    } catch (error) {
      toast.error("An error occurred while saving the address")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddressSelect = (parsedAddress: ParsedAddress) => {
    setCurrentAddress((prev) => ({
      ...prev,
      country: parsedAddress.country,
      state: parsedAddress.state,
      city: parsedAddress.state, // Only state abbreviation (e.g. CA)
      district: parsedAddress.city, // Move city name to district (e.g. Los Angeles)
      postalCode: parsedAddress.postalCode,
      addressLine: parsedAddress.addressLine,
      latitude: parsedAddress.latitude,
      longitude: parsedAddress.longitude,
      placeId: parsedAddress.placeId,
      formattedAddress: parsedAddress.formattedAddress,
    }))
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-steel-blue">My Addresses</h1>
          <p className="text-gray-600 mt-2">Manage your delivery addresses here.</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </button>
        )}
      </div>

      {isEditing && currentAddress ? (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-steel-blue" />
              <h2 className="text-xl font-semibold text-gray-900">
                {currentAddress.id ? "Edit Address" : "Add New Address"}
              </h2>
            </div>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Address Title (e.g. Home, Office)</label>
                <input
                  type="text"
                  required
                  value={currentAddress.title || ""}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue"
                  placeholder="Home, Office etc."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={currentAddress.fullName || ""}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={currentAddress.phoneNumber || ""}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue"
                  placeholder="05xx xxx xxxx"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Zip Code</label>
                <input
                  type="text"
                  required
                  value={currentAddress.postalCode || ""}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, postalCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue"
                  placeholder="Zip Code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <AddressAutocomplete
                onSelect={handleAddressSelect}
                selectedAddress={
                  currentAddress.placeId
                    ? {
                        country: currentAddress.country!,
                        state: currentAddress.state || "",
                        city: currentAddress.district || "", // In current logic, district stores city name
                        district: "", // We don't strictly need this for autocomplete
                        postalCode: currentAddress.postalCode!,
                        addressLine: currentAddress.addressLine!,
                        latitude: currentAddress.latitude!,
                        longitude: currentAddress.longitude!,
                        placeId: currentAddress.placeId!,
                        formattedAddress: currentAddress.formattedAddress!,
                      }
                    : null
                }
              />
            </div>

            {currentAddress.formattedAddress && (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <strong>Selected Address:</strong> {currentAddress.formattedAddress}
              </div>
            )}

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="defaultAddress"
                checked={currentAddress.defaultAddress || false}
                onChange={(e) => setCurrentAddress({ ...currentAddress, defaultAddress: e.target.checked })}
                className="rounded border-gray-300 text-steel-blue focus:ring-steel-blue"
              />
              <label htmlFor="defaultAddress" className="text-sm text-gray-700">
                Set as default address
              </label>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                type="submit"
                disabled={isSaving || !currentAddress.placeId}
                className="flex items-center px-6 py-2 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">You haven't added an address yet.</p>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${
                  address.defaultAddress ? "border-steel-blue ring-1 ring-steel-blue" : "border-gray-200"
                } relative`}
              >
                {address.defaultAddress && (
                  <span className="absolute top-4 right-4 bg-steel-blue/10 text-steel-blue text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    Default
                  </span>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{address.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{address.fullName}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 space-y-1 mb-6">
                  <p>{address.formattedAddress || address.addressLine}</p>
                  <p>{address.phoneNumber}</p>
                </div>
                <div className="flex items-center space-x-4 border-t border-gray-50 pt-4">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex items-center text-sm font-medium text-steel-blue hover:underline"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => setAddressToDelete(address.id)}
                    className="flex items-center text-sm font-medium text-red-600 hover:underline"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!addressToDelete}
        onClose={() => setAddressToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Address"
        description="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
