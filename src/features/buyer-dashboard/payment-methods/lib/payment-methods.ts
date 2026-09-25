import type { SavedPaymentMethod } from "../paymentMethodsData"

/** The buyer's single default card, or `null` when the wallet has none marked default yet
 * (a brand-new wallet, or a load that returned nothing). */
export function selectDefault(methods: SavedPaymentMethod[]): SavedPaymentMethod | null {
  return methods.find((method) => method.status === "default") ?? null
}

/** The buyer's single auto-order card, or `null` when none is enrolled. */
export function selectAutoOrderMethod(methods: SavedPaymentMethod[]): SavedPaymentMethod | null {
  return methods.find((method) => method.autoOrderCard) ?? null
}

export interface AddCardModalDefaults {
  hasCards: boolean
  hasAutoOrderCard: boolean
}

/**
 * Derives `useAddCardFlow`'s starting checkbox state from the current wallet: the first card
 * ever added defaults to "make default", and a card added before any auto-order card exists
 * defaults to "use for auto orders" - both mirrored by `useAddCardFlow`'s own effect, which
 * flips those checkboxes back to their un-set state whenever `hasCards`/`hasAutoOrderCard` change.
 */
export function addModalDefaults(methods: SavedPaymentMethod[]): AddCardModalDefaults {
  return {
    hasCards: methods.length > 0,
    hasAutoOrderCard: selectAutoOrderMethod(methods) !== null,
  }
}
