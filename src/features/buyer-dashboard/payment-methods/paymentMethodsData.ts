export type PaymentMethodType = "visa" | "mastercard" | "amex" | "bank"
export type PaymentMethodStatus = "default" | "backup" | "active"

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
  /** Card carries an off-session Stripe mandate, so it can be charged unattended. */
  openToAutoPayment: boolean
  /** The buyer's single card used to pay for auto orders. */
  autoOrderCard: boolean
}
