"use client"

import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js"
import { LoaderCircle } from "lucide-react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import { cn } from "@/lib/utils"
import FormField from "./FormField"

interface AddCardModalProps {
  isOpen: boolean
  isSaving: boolean
  nickname: string
  makeDefault: boolean
  allowAutoPayments: boolean
  useForAutoOrders: boolean
  hasExistingAutoOrderCard: boolean
  cardElementOptions: Record<string, unknown>
  onNicknameChange: (value: string) => void
  onMakeDefaultChange: (value: boolean) => void
  onAllowAutoPaymentsChange: (value: boolean) => void
  onUseForAutoOrdersChange: (value: boolean) => void
  onClose: () => void
  onSubmit: () => void
}

export default function AddCardModal({
  isOpen,
  isSaving,
  nickname,
  makeDefault,
  allowAutoPayments,
  useForAutoOrders,
  hasExistingAutoOrderCard,
  cardElementOptions,
  onNicknameChange,
  onMakeDefaultChange,
  onAllowAutoPaymentsChange,
  onUseForAutoOrdersChange,
  onClose,
  onSubmit,
}: AddCardModalProps) {
  const idBase = useId()
  const makeDefaultId = `${idBase}-make-default`
  const allowAutoPaymentsId = `${idBase}-allow-auto-payments`
  const useForAutoOrdersId = `${idBase}-use-for-auto-orders`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Payment Card" maxWidthClassName="max-w-xl">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-text-primary">Add new card</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Card details are collected securely by Stripe and never stored on our servers.
        </p>

        <div className="mt-5 space-y-4">
          <FormField label="Card nickname">
            <Input
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="e.g. Main Clinic Card"
              disabled={isSaving}
            />
          </FormField>

          <FormField label="Card number">
            <div className="rounded-md border border-border-soft bg-surface px-3 py-3">
              <CardNumberElement options={cardElementOptions} />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expiry date">
              <div className="rounded-md border border-border-soft bg-surface px-3 py-3">
                <CardExpiryElement options={cardElementOptions} />
              </div>
            </FormField>
            <FormField label="CVC">
              <div className="rounded-md border border-border-soft bg-surface px-3 py-3">
                <CardCvcElement options={cardElementOptions} />
              </div>
            </FormField>
          </div>
        </div>

        <label
          htmlFor={makeDefaultId}
          className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
        >
          <Checkbox
            id={makeDefaultId}
            checked={makeDefault}
            onChange={(e) => onMakeDefaultChange(e.target.checked)}
            disabled={isSaving}
          />
          Set as my default payment card
        </label>

        <div className="mt-4 rounded-lg border border-border-soft bg-surface p-4">
          <label
            htmlFor={allowAutoPaymentsId}
            className="flex cursor-pointer items-start gap-2 text-sm text-text-primary"
          >
            <Checkbox
              id={allowAutoPaymentsId}
              className="mt-0.5"
              checked={allowAutoPayments}
              onChange={(e) => {
                const next = e.target.checked
                onAllowAutoPaymentsChange(next)
                // The backend rejects an auto order card that is not open to
                // automatic payments, so the two can never diverge.
                if (!next) onUseForAutoOrdersChange(false)
              }}
              disabled={isSaving}
            />
            <span>
              Allow automatic payments for repeat orders
              <span className="mt-1 block text-xs text-text-secondary">
                Authorises your bank to let us charge this card while you're away. Required for auto orders — you can
                withdraw it anytime by removing the card.
              </span>
            </span>
          </label>

          <label
            htmlFor={useForAutoOrdersId}
            className={cn(
              "mt-3 flex items-start gap-2 border-t border-border-soft pt-3 text-sm text-text-primary",
              allowAutoPayments ? "cursor-pointer" : "cursor-not-allowed opacity-55",
            )}
          >
            <Checkbox
              id={useForAutoOrdersId}
              className="mt-0.5"
              checked={useForAutoOrders}
              onChange={(e) => onUseForAutoOrdersChange(e.target.checked)}
              disabled={isSaving || !allowAutoPayments}
            />
            <span>
              Use this card for my auto orders
              <span className="mt-1 block text-xs text-text-secondary">
                {hasExistingAutoOrderCard
                  ? "You can only have one auto order card — this replaces the one you use today."
                  : "Future repeat orders will be charged to this card."}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={onSubmit}
            className={cn("relative transition-[padding] duration-200", isSaving && "pl-7")}
          >
            <div
              className={cn(
                "absolute left-2.5 -translate-x-2 opacity-0 transition-all duration-200 ease-in-out",
                isSaving && "translate-x-0 opacity-100",
              )}
            >
              <LoaderCircle className="animate-spin" size={12} strokeWidth={2} aria-hidden="true" />
            </div>
            Save Card
          </Button>
        </div>
      </div>
    </Modal>
  )
}
