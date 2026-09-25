import { queryOptions } from "@tanstack/react-query"
import { type AutoOrder, autoOrdersAPI, type UpdateAutoOrderPayload } from "@/lib/api/auto-orders"
import { queryKeys } from "@/lib/query/keys"
import { FETCH_ONCE_PER_MOUNT, getQueryClient } from "@/lib/query/query-client"

/**
 * Every mount fetches once and a failure goes straight to the page's toast (no retry). A malformed
 * 200 carrying a wrong-typed value must not reach `.map()`/`.length` in the list.
 */
export function autoOrdersListOptions(enabled = true) {
  return queryOptions<AutoOrder[]>({
    queryKey: queryKeys.autoOrders.list(),
    queryFn: async ({ signal }) => {
      const response = await autoOrdersAPI.getAutoOrders(signal)
      return Array.isArray(response.autoOrders) ? response.autoOrders : []
    },
    enabled,
    ...FETCH_ONCE_PER_MOUNT,
  })
}

function patchAutoOrder(updated: AutoOrder): void {
  getQueryClient().setQueryData<AutoOrder[]>(queryKeys.autoOrders.list(), (current) =>
    current?.map((item) => (item.id === updated.id ? updated : item)),
  )
}

function removeAutoOrder(autoOrderId: string): void {
  getQueryClient().setQueryData<AutoOrder[]>(queryKeys.autoOrders.list(), (current) =>
    current?.filter((item) => item.id !== autoOrderId),
  )
}

/** Both entries are shared with checkout and the payment-methods page, so this reaches every reader. */
async function refetchReadiness(): Promise<void> {
  await Promise.all([
    getQueryClient().refetchQueries({ queryKey: queryKeys.addresses.list() }),
    getQueryClient().refetchQueries({ queryKey: queryKeys.paymentMethods.cards() }),
  ])
}

/**
 * Update/delete patch the list cache directly (no extra GET); an update failure also refetches the
 * two readiness reads.
 */
export const autoOrdersCommands = {
  async updateAutoOrder(autoOrderId: string, payload: UpdateAutoOrderPayload): Promise<AutoOrder> {
    try {
      const updated = await autoOrdersAPI.updateAutoOrder(autoOrderId, payload)
      patchAutoOrder(updated)
      return updated
    } catch (error) {
      await refetchReadiness()
      throw error
    }
  },

  async deleteAutoOrder(autoOrderId: string): Promise<void> {
    await autoOrdersAPI.deleteAutoOrder(autoOrderId)
    removeAutoOrder(autoOrderId)
  },
}
