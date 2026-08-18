import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import apiClient from "./client"

export interface AutoOrder {
  id: string
  userProductId: string
  productId: string | null
  productName: string | null
  productCoverPhotoPath: string | null
  price: number
  quantity: number
  period: AutoOrderPeriod
  nextOrderDate: string
  active: boolean
  sellerName: string | null
  createdDate: string
  updatedDate: string
}

export interface AutoOrdersResponse {
  autoOrders: AutoOrder[]
  total: number
}

/**
 * Every field is optional; the backend only touches the ones that are sent.
 * Changing `period` restarts the countdown from now.
 */
export interface UpdateAutoOrderPayload {
  quantity?: number
  active?: boolean
  period?: AutoOrderPeriod
}

class AutoOrdersAPI {
  async getAutoOrders(signal?: AbortSignal): Promise<AutoOrdersResponse> {
    const response = await apiClient.get<AutoOrdersResponse>("/auto-orders", { signal })
    return response.data
  }

  async updateAutoOrder(autoOrderId: string, payload: UpdateAutoOrderPayload): Promise<AutoOrder> {
    const response = await apiClient.patch<AutoOrder>(`/auto-orders/${autoOrderId}`, payload)
    return response.data
  }

  async deleteAutoOrder(autoOrderId: string): Promise<void> {
    await apiClient.delete(`/auto-orders/${autoOrderId}`)
  }
}

export const autoOrdersAPI = new AutoOrdersAPI()
