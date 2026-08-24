import type { AccountUser } from "@/lib/api/account"
import type { Address } from "@/lib/api/address"
import type { CompanyProfile } from "@/lib/api/company"
import type { License } from "@/lib/api/licenses"

/**
 * `authStore.ts` declares its own `User` interface but does not export it, so
 * this factory uses `AccountUser` from `src/lib/api/account.ts` instead - it
 * mirrors the same backend shape (id, name, surname, email, ...) and is the
 * type actually returned by the `/backend-api/users/me` contract.
 */
export function makeAccountUser(overrides: Partial<AccountUser> = {}): AccountUser {
  return {
    id: "user-1",
    name: "Serhat",
    surname: "Belen",
    email: "serhat.belen@example.com",
    phoneNumber: "+15551234567",
    emailConfirmed: true,
    phoneNumberConfirmed: true,
    twoFactorEnabled: false,
    lockoutEnd: null,
    createdDate: "2026-01-01T00:00:00Z",
    roleName: "BUYER",
    ...overrides,
  }
}

export function makeCompanyProfile(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    id: "company-1",
    name: "Acme Dental Supplies",
    companyPhoto: null,
    taxNumber: "1234567890",
    email: "billing@acmedental.example.com",
    phoneNumber: "+15551234567",
    website: "https://acmedental.example.com",
    description: "Wholesale dental supplies",
    active: true,
    createdDate: "2026-01-01T00:00:00Z",
    companyRole: "OWNER",
    ...overrides,
  }
}

export function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: "address-1",
    title: "Home",
    fullName: "Serhat Belen",
    phoneNumber: "+15551234567",
    country: "US",
    state: "NY",
    city: "New York",
    district: "Kadikoy",
    postalCode: "10016",
    addressLine: "201 Madison Ave",
    defaultAddress: true,
    latitude: 40.7484,
    longitude: -73.9857,
    placeId: "place-1",
    formattedAddress: "201 Madison Ave, New York, NY",
    ...overrides,
  }
}

export function makeLicense(overrides: Partial<License> = {}): License {
  return {
    id: "license-1",
    licenseType: "STATE_DENTAL",
    stateOfLicense: "NY",
    licenseNumber: "DDS-123456",
    year: 2024,
    month: 6,
    day: 15,
    approved: true,
    rejectDescription: null,
    expired: false,
    createdDate: "2026-01-01T00:00:00Z",
    updatedDate: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}
