import { queryOptions } from "@tanstack/react-query"
import { type AutoOrder, autoOrdersAPI, type UpdateAutoOrderPayload } from "@/lib/api/auto-orders"
import { queryKeys } from "@/lib/query/keys"
import { getQueryClient } from "@/lib/query/query-client"

/**
 * `GET /auto-orders` (Phase 4 design doc §2.1/B3). `staleTime: 0, gcTime: 0, retry: false`
 * (§2.2 fetch policy parity): every mount fetches once, and a failure goes straight to the
 * page's existing toast. The `Array.isArray` guard replaces the old hook's `?? []` fallback -
 * a malformed 200 carrying a wrong-typed truthy value must not reach `.map()`/`.length` in the
 * list (infra note #26).
 */
export function autoOrdersListOptions(enabled = true) {
  return queryOptions<AutoOrder[]>({
    queryKey: queryKeys.autoOrders.list(),
    queryFn: async ({ signal }) => {
      const response = await autoOrdersAPI.getAutoOrders(signal)
      return Array.isArray(response.autoOrders) ? response.autoOrders : []
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
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

/**
 * Readiness refetch (§2.3): "On update failure: `refetchQueries(addresses.list)` +
 * `refetchQueries(paymentMethods.cards)` (today: `fetchReadiness()`)". Both share options
 * objects with checkout and the payment-methods page (K0), so this reaches every reader.
 */
async function refetchReadiness(): Promise<void> {
  await Promise.all([
    getQueryClient().refetchQueries({ queryKey: queryKeys.addresses.list() }),
    getQueryClient().refetchQueries({ queryKey: queryKeys.paymentMethods.cards() }),
  ])
}

/**
 * Auto-order writes (Phase 4 §2.3/B3). Update/delete patch the list cache directly (no extra
 * GET, matching the old hook's local `setAutoOrders`); an update failure additionally refetches
 * the two readiness reads, same as the old `fetchReadiness()` call in the failure branch.
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
