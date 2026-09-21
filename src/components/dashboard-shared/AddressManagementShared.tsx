"use client"

import { Edit2, MapPin, Plus, Save } from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import AddressAutocomplete from "@/components/AddressAutocomplete"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showToast } from "@/components/ui/Toast"
import { type Address, addressAPI, type CreateAddressPayload, type UpdateAddressPayload } from "@/lib/api/address"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { useAuthStore } from "@/stores/authStore"

/** Register-time address parts that the summary line above doesn't always spell out. */
const formatAddressDetails = (address: Address) =>
  [address.district, address.city, address.postalCode, address.country]
    .map((part) => part?.trim())
    .filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index)
    .join(" · ")

export default function AddressManagementShared() {
  const { user } = useAuthStore()
  const isVendor = user?.roleName === "Vendor"
  const idBase = useId()
  const addressTitleId = `${idBase}-address-title`
  const fullNameId = `${idBase}-full-name`
  const phoneNumberId = `${idBase}-phone-number`
  const zipCodeId = `${idBase}-zip-code`
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<Partial<Address> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const fetchAddresses = useCallback(async () => {
    try {
      const data = await addressAPI.getAddresses()
      setAddresses(data)
      setLoadFailed(false)
    } catch (_error) {
      showToast.error("An error occurred while loading addresses")
      setLoadFailed(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const handleEdit = (address: Address) => {
    setCurrentAddress(address)
    setIsEditing(true)
  }

  const handleAddNew = () => {
    setCurrentAddress({
      title: "",
      fullName: `${user?.name || ""} ${user?.surname || ""}`.trim(),
      phoneNumber: user?.phoneNumber || "",
      defaultAddress: true,
    })
    setIsEditing(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAddress) return

    if (!currentAddress.postalCode?.trim()) {
      showToast.error("Zip code is required")
      return
    }

    setIsSaving(true)
    try {
      const isUpdate = !!currentAddress.id
      // Only ever one address (buyer or vendor), so it must always be the default:
      // useAutoOrders' hasPrimaryAddress check reads this flag directly for buyers, and the
      // backend picks a vendor's ship-from / Uber pickup address via defaultAddress=true too.
      const addressPayload = { ...currentAddress, defaultAddress: true }

      if (isUpdate) {
        const addressId = currentAddress.id
        if (!addressId) {
          throw new Error("Address ID is missing for update")
        }
        await addressAPI.updateAddress(addressId, addressPayload as UpdateAddressPayload)
      } else {
        await addressAPI.createAddress(addressPayload as CreateAddressPayload)
      }

      showToast.success(isUpdate ? "Address updated" : "New address added")
      setIsEditing(false)
      setCurrentAddress(null)
      fetchAddresses()
    } catch (_error) {
      showToast.error("An error occurred while saving the address")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddressSelect = (parsedAddress: ParsedAddress) => {
    setCurrentAddress((prev) => ({
      ...prev,
      country: parsedAddress.country,
      // Address (backend AddressResponse/Create/UpdateRequest) has no `state` column - the
      // state abbreviation is folded into `city` instead, same as before. Do not add a `state`
      // key to `currentAddress`: it would be forwarded verbatim to createAddress/updateAddress,
      // silently dropped by the backend, and the buyer would believe a value was saved that
      // never was (see the comment on the `Address` type in @/lib/api/address).
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
    return <div className="p-8 text-center text-text-secondary">Loading...</div>
  }

  const selectedAddress =
    currentAddress?.placeId &&
    currentAddress.country &&
    currentAddress.postalCode &&
    currentAddress.addressLine &&
    typeof currentAddress.latitude === "number" &&
    typeof currentAddress.longitude === "number" &&
    currentAddress.formattedAddress
      ? {
          country: currentAddress.country,
          // Address has no `state` field (folded into `city`, see handleAddressSelect); this
          // union only exists to satisfy AddressAutocomplete's ParsedAddress-shaped prop.
          state: "",
          city: currentAddress.district || "", // In current logic, district stores city name
          district: "", // We don't strictly need this for autocomplete
          postalCode: currentAddress.postalCode,
          addressLine: currentAddress.addressLine,
          latitude: currentAddress.latitude,
          longitude: currentAddress.longitude,
          placeId: currentAddress.placeId,
          formattedAddress: currentAddress.formattedAddress,
        }
      : null

  const addressForm = currentAddress && (
    <form onSubmit={handleSave} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={addressTitleId} className="text-text-secondary">
            Address Title (e.g. Home, Office)
          </Label>
          <Input
            id={addressTitleId}
            type="text"
            required
            value={currentAddress.title || ""}
            onChange={(e) => setCurrentAddress({ ...currentAddress, title: e.target.value })}
            placeholder="Home, Office etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fullNameId} className="text-text-secondary">
            Full Name
          </Label>
          <Input
            id={fullNameId}
            type="text"
            required
            value={currentAddress.fullName || ""}
            onChange={(e) => setCurrentAddress({ ...currentAddress, fullName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={phoneNumberId} className="text-text-secondary">
            Phone Number
          </Label>
          <Input
            id={phoneNumberId}
            type="tel"
            required
            value={currentAddress.phoneNumber || ""}
            onChange={(e) => setCurrentAddress({ ...currentAddress, phoneNumber: e.target.value })}
            placeholder="05xx xxx xxxx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={zipCodeId} className="text-text-secondary">
            Zip Code
          </Label>
          <Input
            id={zipCodeId}
            type="text"
            required
            value={currentAddress.postalCode || ""}
            onChange={(e) => setCurrentAddress({ ...currentAddress, postalCode: e.target.value })}
            placeholder="Zip Code"
          />
        </div>
      </div>

      <div className="space-y-2">
        <AddressAutocomplete onSelect={handleAddressSelect} selectedAddress={selectedAddress} />
      </div>

      {currentAddress.formattedAddress && (
        <div className="rounded-lg bg-surface-muted p-4 text-sm text-text-secondary">
          <strong>Selected Address:</strong> {currentAddress.formattedAddress}
        </div>
      )}

      <div className="pt-4 flex space-x-3">
        <Button type="submit" disabled={isSaving || !currentAddress.placeId} className="rounded-lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button type="button" onClick={() => setIsEditing(false)} variant="outline" className="rounded-lg">
          Cancel
        </Button>
      </div>
    </form>
  )

  // Only one address is ever shown/managed; any others already in `addresses` stay untouched.
  const displayedAddress = addresses.find((a) => a.defaultAddress) ?? addresses[0] ?? null

  const renderAddressCard = (address: Address) => (
    <div
      key={address.id}
      className="group relative overflow-hidden rounded-2xl border border-brand/40 bg-surface-elevated p-6 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-panel"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-brand" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-text-primary">{address.title}</h3>
            <p className="mt-0.5 text-sm text-text-secondary">{address.fullName}</p>
          </div>
        </div>
      </div>
      <div className="mb-6 space-y-1 pl-[3.25rem] text-sm text-text-muted">
        <p>{address.formattedAddress || address.addressLine}</p>
        <p>{address.phoneNumber}</p>
        {formatAddressDetails(address) && <p>{formatAddressDetails(address)}</p>}
      </div>
      <div className="flex items-center gap-4 border-t border-border-soft pt-4">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => handleEdit(address)}
          className="h-auto p-0 text-sm font-medium text-brand"
        >
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  )

  const emptyState = (
    <div className="col-span-full rounded-2xl border border-dashed border-border-strong bg-surface-muted/40 p-12 text-center">
      <MapPin className="icon-float mx-auto mb-4 h-10 w-10 text-brand/60" />
      <p className="text-text-secondary">You haven't added an address yet.</p>
      <Button type="button" onClick={handleAddNew} variant="link" size="sm" className="mt-2 h-auto p-0">
        Add your address
      </Button>
    </div>
  )

  const loadFailedState = (
    <div className="col-span-full rounded-2xl border border-dashed border-border-strong bg-surface-muted/40 p-12 text-center">
      <MapPin className="mx-auto mb-4 h-10 w-10 text-brand/60" />
      <p className="text-text-secondary">We couldn't load your address.</p>
      <Button type="button" onClick={fetchAddresses} variant="link" size="sm" className="mt-2 h-auto p-0">
        Try again
      </Button>
    </div>
  )

  const addressList = (
    <div className="grid grid-cols-1 gap-5">
      {loadFailed ? loadFailedState : displayedAddress ? renderAddressCard(displayedAddress) : emptyState}
    </div>
  )

  return (
    <section
      className="fade-up overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
      style={{ animationDelay: "280ms" }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border-soft p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Address</h2>
            <p className="text-sm text-text-muted">
              {isVendor
                ? "Orders ship from this address. It also determines local delivery availability."
                : "Your delivery location."}
            </p>
          </div>
        </div>
        {!isEditing && !loadFailed && addresses.length === 0 && (
          <Button onClick={handleAddNew} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New
          </Button>
        )}
      </div>
      {isEditing && currentAddress ? addressForm : <div className="p-6">{addressList}</div>}
    </section>
  )
}
