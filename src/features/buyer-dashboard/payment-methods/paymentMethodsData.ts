export type PaymentMethodType = "visa" | "mastercard" | "amex" | "bank"
export type PaymentMethodStatus = "default" | "backup" | "active"
export type ActivityStatus = "Completed" | "Scheduled" | "Failed"

export interface SavedPaymentMethod {
  id: string
  type: PaymentMethodType
  brandLabel: string
  nickname: string
  last4: string
  cardholder: string
  expiryMonth: string
  expiryYear: string
  billingAddress: string
  status: PaymentMethodStatus
  stripePaymentMethodId?: string
}

export interface BankMethod {
  id: string
  bankName: string
  accountNickname: string
  last4: string
  verificationStatus: "Verified" | "Pending"
}

export interface PaymentActivity {
  id: string
  date: string
  invoiceId: string
  amount: number
  methodLabel: string
  status: ActivityStatus
}

export const initialSavedPaymentMethods: ReadonlyArray<SavedPaymentMethod> = [
  {
    id: "pm-1",
    type: "visa",
    brandLabel: "Visa",
    nickname: "Main Clinic Card",
    last4: "4532",
    cardholder: "Serhat Belen",
    expiryMonth: "09",
    expiryYear: "2028",
    billingAddress: "201 Madison Ave, New York, NY",
    status: "default",
  },
  {
    id: "pm-2",
    type: "mastercard",
    brandLabel: "Mastercard",
    nickname: "Procurement Backup",
    last4: "8888",
    cardholder: "Serhat Belen",
    expiryMonth: "01",
    expiryYear: "2029",
    billingAddress: "201 Madison Ave, New York, NY",
    status: "backup",
  },
  {
    id: "pm-3",
    type: "amex",
    brandLabel: "Amex",
    nickname: "Equipment Purchases",
    last4: "1021",
    cardholder: "Serhat Belen",
    expiryMonth: "06",
    expiryYear: "2027",
    billingAddress: "201 Madison Ave, New York, NY",
    status: "active",
  },
]

export const bankMethods: ReadonlyArray<BankMethod> = [
  {
    id: "bank-1",
    bankName: "Chase Business",
    accountNickname: "Operations ACH",
    last4: "7751",
    verificationStatus: "Verified",
  },
  {
    id: "bank-2",
    bankName: "Wells Fargo",
    accountNickname: "Expansion Fund",
    last4: "0934",
    verificationStatus: "Pending",
  },
]

export const paymentActivities: ReadonlyArray<PaymentActivity> = [
  {
    id: "act-1",
    date: "2026-04-29",
    invoiceId: "INV-2026-0156",
    amount: 1247.85,
    methodLabel: "Visa •••• 4532",
    status: "Completed",
  },
  {
    id: "act-2",
    date: "2026-04-27",
    invoiceId: "INV-2026-0155",
    amount: 8950,
    methodLabel: "ACH •••• 7751",
    status: "Scheduled",
  },
  {
    id: "act-3",
    date: "2026-04-25",
    invoiceId: "INV-2026-0154",
    amount: 542.3,
    methodLabel: "Mastercard •••• 8888",
    status: "Failed",
  },
  {
    id: "act-4",
    date: "2026-04-19",
    invoiceId: "INV-2026-0153",
    amount: 389.45,
    methodLabel: "Visa •••• 4532",
    status: "Completed",
  },
]
