"use client"

import { Loader2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBuyerOrdersRefundModalActions, useBuyerOrdersRefundModalState } from "../context/buyer-orders-context"
import { getOrderItems } from "../lib/order-view-utils"

interface RefundFormItemState {
  isSelected: boolean
  quantity: number
  returnReason: string
}

type RefundFormState = Record<string, RefundFormItemState>

const RETURN_REASON_OPTIONS = [
  "Wrong Item Received",
  "Product Arrived Damaged",
  "Defective or Malfunctioning Product",
  "Missing Parts or Accessories",
  "Item Does Not Match Description",
  "Ordered by Mistake",
  "No Longer Needed",
  "Other",
] as const

function createInitialFormState(orderItems: ReturnType<typeof getOrderItems>): RefundFormState {
  const shouldPreselectOnlyItem = orderItems.length === 1

  return orderItems.reduce<RefundFormState>((acc, item) => {
    acc[item.id] = {
      isSelected: shouldPreselectOnlyItem,
      quantity: 1,
      returnReason: "",
    }
    return acc
  }, {})
}

export default function RefundOrderModal() {
  const { isSubmittingRefund, pendingRefundOrder } = useBuyerOrdersRefundModalState()
  const { setPendingRefundOrder, submitRefundOrder } = useBuyerOrdersRefundModalActions()
  const [formState, setFormState] = useState<RefundFormState>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const orderItems = useMemo(
    () =>
      pendingRefundOrder
        ? getOrderItems(pendingRefundOrder).filter(
            (item) => !(typeof item.returnDate === "string" && item.returnDate.trim().length > 0),
          )
        : [],
    [pendingRefundOrder],
  )

  useEffect(() => {
    if (!pendingRefundOrder) {
      setFormState({})
      setErrorMessage(null)
      return
    }

    setFormState(createInitialFormState(orderItems))
    setErrorMessage(null)
  }, [pendingRefundOrder, orderItems])

  if (!pendingRefundOrder) return null

  const handleClose = () => {
    if (isSubmittingRefund) return
    setPendingRefundOrder(null)
  }

  const handleSubmit = async () => {
    const selectedItems = orderItems.filter((item) => formState[item.id]?.isSelected)

    if (selectedItems.length === 0) {
      setErrorMessage("Please select at least one item to refund.")
      return
    }

    const payloadItems = selectedItems.map((item) => {
      const current = formState[item.id]
      return {
        orderItemId: item.id,
        quantity: current.quantity,
        returnReason: current.returnReason.trim(),
      }
    })

    if (
      payloadItems.some(
        (item) =>
          !item.returnReason ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > (orderItems.find((orderItem) => orderItem.id === item.orderItemId)?.quantity ?? 0),
      )
    ) {
      setErrorMessage("Each selected item must have a valid quantity and a return reason.")
      return
    }

    setErrorMessage(null)
    await submitRefundOrder({ items: payloadItems })
  }

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title="Request return"
      maxWidthClassName="max-w-3xl"
      closeOnEscape={!isSubmittingRefund}
      closeOnOverlayClick={!isSubmittingRefund}
      contentClassName="rounded-2xl border border-border-soft bg-surface-elevated shadow-panel"
    >
      <div>
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Request Return</h2>
            <p className="text-xs text-text-muted">Order: {pendingRefundOrder.orderId}</p>
          </div>
          <Button
            type="button"
            variant="quiet"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Close refund modal"
            disabled={isSubmittingRefund}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
          {orderItems.map((item) => {
            const state = formState[item.id]
            if (!state) return null

            return (
              <div key={item.id} className="rounded-xl border border-border-soft bg-surface-muted/45 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={state.isSelected}
                    onChange={(event) => {
                      const isSelected = event.target.checked
                      setFormState((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], isSelected },
                      }))
                    }}
                    className="mt-1"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{item.productName}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      Max refundable quantity:{" "}
                      <span className="font-semibold text-text-secondary">{item.quantity}</span>
                    </p>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`refund-qty-${item.id}`}
                          className="mb-1 block text-xs font-medium text-text-secondary"
                        >
                          Quantity to refund
                        </label>
                        <Input
                          id={`refund-qty-${item.id}`}
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={state.quantity}
                          disabled={!state.isSelected || isSubmittingRefund}
                          onChange={(event) => {
                            const parsed = Number.parseInt(event.target.value, 10)
                            const nextQuantity = Number.isNaN(parsed) ? 1 : parsed
                            setFormState((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                quantity: Math.min(Math.max(nextQuantity, 1), item.quantity),
                              },
                            }))
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label
                        htmlFor={`refund-reason-${item.id}`}
                        className="mb-1 block text-xs font-medium text-text-secondary"
                      >
                        Return reason
                      </label>
                      <Select
                        disabled={!state.isSelected || isSubmittingRefund}
                        value={state.returnReason}
                        onValueChange={(returnReason) => {
                          setFormState((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              returnReason,
                            },
                          }))
                        }}
                      >
                        <SelectTrigger
                          id={`refund-reason-${item.id}`}
                          className="h-10 w-full rounded-lg border-border-strong bg-surface-elevated px-3 py-2 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          <SelectValue placeholder="Select a return reason" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {RETURN_REASON_OPTIONS.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-3 border-t border-border-soft px-6 py-4">
          {errorMessage ? <p className="text-sm font-medium text-danger">{errorMessage}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmittingRefund}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmittingRefund}>
              {isSubmittingRefund ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit refund request"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
