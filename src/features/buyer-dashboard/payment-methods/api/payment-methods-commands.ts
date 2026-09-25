import { paymentMethodsAPI, type SaveCardPayload } from "@/lib/api/payment-methods"
import { queryKeys } from "@/lib/query/keys"
import { getQueryClient } from "@/lib/query/query-client"
import type { SavedPaymentMethod } from "../paymentMethodsData"

/**
 * Payment-method writes (Phase 4 design doc §2.3/B2b). Two cache-effect shapes, matching what
 * `BuyerPaymentMethodsPage`'s pre-Query code did (characterized in B2a's GET-count tests):
 * - add / upgrade / set-or-stop-auto-order-card / delete: the old code called `refreshMethods()`
 *   (a fresh GET) after these - `invalidateQueries` reproduces that as exactly one refetch.
 * - rename / set default: the old code patched `methods` locally without a GET - `setQueryData`
 *   reproduces that with no network request.
 */

async function invalidateCards(): Promise<void> {
  await getQueryClient().invalidateQueries({ queryKey: queryKeys.paymentMethods.all })
}

function patchCard(updated: SavedPaymentMethod): void {
  getQueryClient().setQueryData<SavedPaymentMethod[]>(queryKeys.paymentMethods.cards(), (current) =>
    current?.map((method) => (method.id === updated.id ? updated : method)),
  )
}

/** Same "one default at a time" patch the old `setAsDefault` did locally. */
function patchDefaultCard(updated: SavedPaymentMethod): void {
  getQueryClient().setQueryData<SavedPaymentMethod[]>(queryKeys.paymentMethods.cards(), (current) =>
    current?.map((method) => {
      if (method.id === updated.id) return updated
      if (method.status === "default") return { ...method, status: "active" }
      return method
    }),
  )
}

export const paymentMethodsCommands = {
  createSetupIntent(openToAutoPayment: boolean) {
    return paymentMethodsAPI.createSetupIntent(openToAutoPayment)
  },

  async saveCard(payload: SaveCardPayload): Promise<SavedPaymentMethod> {
    const saved = await paymentMethodsAPI.saveCard(payload)
    await invalidateCards()
    return saved
  },

  async deleteCard(cardId: string): Promise<void> {
    await paymentMethodsAPI.deleteCard(cardId)
    await invalidateCards()
  },

  async renameCard(cardId: string, nickname: string): Promise<SavedPaymentMethod> {
    const updated = await paymentMethodsAPI.updateNickname(cardId, { nickname })
    patchCard(updated)
    return updated
  },

  async setDefaultCard(cardId: string): Promise<SavedPaymentMethod> {
    const updated = await paymentMethodsAPI.setDefault(cardId)
    patchDefaultCard(updated)
    return updated
  },

  async setAutoOrderCard(cardId: string, autoOrderCard: boolean): Promise<SavedPaymentMethod> {
    const updated = await paymentMethodsAPI.setAutoOrderCard(cardId, autoOrderCard)
    await invalidateCards()
    return updated
  },

  createAutoPaymentUpgradeSetupIntent(cardId: string) {
    return paymentMethodsAPI.createAutoPaymentUpgradeSetupIntent(cardId)
  },

  async confirmAutoPaymentUpgrade(cardId: string, setupIntentId: string): Promise<SavedPaymentMethod> {
    const updated = await paymentMethodsAPI.confirmAutoPaymentUpgrade(cardId, setupIntentId)
    await invalidateCards()
    return updated
  },
}
