"use client"

import { Banknote, CheckCircle2, CreditCard, Edit3, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"
import { initialSavedPaymentMethods, type SavedPaymentMethod } from "./paymentMethodsData"

interface PaymentMethodFormState {
  nickname: string
  cardholder: string
  last4: string
  expiryMonth: string
  expiryYear: string
  billingAddress: string
  makeDefault: boolean
}

const initialFormState: PaymentMethodFormState = {
  nickname: "",
  cardholder: "",
  last4: "",
  expiryMonth: "",
  expiryYear: "",
  billingAddress: "",
  makeDefault: true,
}

const methodToneMap: Record<SavedPaymentMethod["type"], string> = {
  visa: "bg-brand/15 text-brand",
  mastercard: "bg-warning/18 text-warning",
  amex: "bg-success/15 text-success",
  bank: "bg-surface-muted text-text-secondary",
}

export default function BuyerPaymentMethodsPage() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([...initialSavedPaymentMethods])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null)
  const [formState, setFormState] = useState<PaymentMethodFormState>(initialFormState)

  const defaultMethod = methods.find((method) => method.status === "default") ?? null

  const openAddModal = () => {
    setEditingMethodId(null)
    setFormState(initialFormState)
    setIsModalOpen(true)
  }

  const openEditModal = (method: SavedPaymentMethod) => {
    setEditingMethodId(method.id)
    setFormState({
      nickname: method.nickname,
      cardholder: method.cardholder,
      last4: method.last4,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      billingAddress: method.billingAddress,
      makeDefault: method.status === "default",
    })
    setIsModalOpen(true)
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setEditingMethodId(null)
    setFormState(initialFormState)
  }

  const handleSaveMethod = () => {
    if (!formState.nickname.trim() || !formState.cardholder.trim()) {
      showToast.error("Missing fields", "Nickname and cardholder are required.")
      return
    }
    if (!/^\d{4}$/.test(formState.last4)) {
      showToast.error("Invalid card", "Last 4 must be exactly 4 digits.")
      return
    }
    if (!/^\d{2}$/.test(formState.expiryMonth) || !/^\d{4}$/.test(formState.expiryYear)) {
      showToast.error("Invalid expiry", "Use MM and YYYY format for expiry.")
      return
    }

    setMethods((currentMethods) => {
      const baseStatus: SavedPaymentMethod["status"] = formState.makeDefault ? "default" : "active"

      if (editingMethodId) {
        return currentMethods.map<SavedPaymentMethod>((method) => {
          if (method.id === editingMethodId) {
            return {
              ...method,
              nickname: formState.nickname.trim(),
              cardholder: formState.cardholder.trim(),
              last4: formState.last4,
              expiryMonth: formState.expiryMonth,
              expiryYear: formState.expiryYear,
              billingAddress: formState.billingAddress.trim(),
              status: baseStatus,
            }
          }

          if (formState.makeDefault && method.status === "default") return { ...method, status: "active" }
          return method
        })
      }

      const newMethod: SavedPaymentMethod = {
        id: `pm-${Date.now()}`,
        type: "visa",
        brandLabel: "Visa",
        nickname: formState.nickname.trim(),
        cardholder: formState.cardholder.trim(),
        last4: formState.last4,
        expiryMonth: formState.expiryMonth,
        expiryYear: formState.expiryYear,
        billingAddress: formState.billingAddress.trim(),
        status: baseStatus,
      }

      const normalizedMethods = formState.makeDefault
        ? currentMethods.map<SavedPaymentMethod>((method) =>
            method.status === "default" ? { ...method, status: "active" } : method,
          )
        : currentMethods

      return [newMethod, ...normalizedMethods]
    })

    showToast.success(editingMethodId ? "Method updated" : "Method added")
    resetModal()
  }

  const setAsDefault = (methodId: string) => {
    setMethods((currentMethods) =>
      currentMethods.map((method) => {
        if (method.id === methodId) return { ...method, status: "default" }
        if (method.status === "default") return { ...method, status: "active" }
        return method
      }),
    )
    showToast.success("Default updated", "Primary payment method changed.")
  }

  const removeMethod = (methodId: string) => {
    setMethods((currentMethods) => {
      if (currentMethods.length === 1) {
        showToast.warning("Cannot remove", "At least one payment method must remain.")
        return currentMethods
      }

      const removedMethod = currentMethods.find((method) => method.id === methodId)
      const remaining = currentMethods.filter((method) => method.id !== methodId)

      if (removedMethod?.status === "default") {
        const [nextDefault, ...rest] = remaining
        return [{ ...nextDefault, status: "default" }, ...rest]
      }

      return remaining
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Payment Methods</h1>
            <p className="mt-2 max-w-3xl text-text-secondary">
              Manage cards and bank methods used for invoice settlement. Configure auto-pay behavior and fallback rules.
            </p>
          </div>
          <Button type="button" onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Add New Method
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard
            icon={<CreditCard className="h-5 w-5 text-brand" />}
            label="Active Cards"
            value={String(methods.length)}
            hint="Ready for payments"
          />
          <KpiCard
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
            label="Default Method"
            value={defaultMethod ? `${defaultMethod.brandLabel} •••• ${defaultMethod.last4}` : "N/A"}
            hint={defaultMethod?.nickname || "Not set"}
          />
          <KpiCard
            icon={<Banknote className="h-5 w-5 text-warning" />}
            label="Upcoming Payments"
            value="$0.00"
            hint="Scheduled activity hidden"
          />
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Saved Methods</h2>
          <span className="text-sm text-text-muted">{methods.length} methods</span>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {methods.map((method) => (
            <article key={method.id} className="rounded-xl border border-border-soft bg-surface-elevated p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", methodToneMap[method.type])}>
                      {method.brandLabel}
                    </span>
                    <StatusTag status={method.status} />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-text-primary">{method.nickname}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton label="Edit" onClick={() => openEditModal(method)} icon={<Edit3 className="h-4 w-4" />} />
                  <IconButton
                    label="Remove"
                    onClick={() => removeMethod(method.id)}
                    icon={<Trash2 className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Meta label="Card" value={`•••• ${method.last4}`} />
                <Meta label="Expiry" value={`${method.expiryMonth}/${method.expiryYear}`} />
                <Meta label="Cardholder" value={method.cardholder} />
                <Meta label="Billing" value={method.billingAddress} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {method.status !== "default" ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setAsDefault(method.id)}>
                    Set as Default
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled>
                    Default Method
                  </Button>
                )}
                <Button type="button" variant="quiet" size="sm" onClick={() => openEditModal(method)}>
                  Edit Details
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={resetModal}
        title={editingMethodId ? "Edit Payment Method" : "Add Payment Method"}
        maxWidthClassName="max-w-xl"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-text-primary">
            {editingMethodId ? "Edit payment method" : "Add new payment method"}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {editingMethodId
              ? "Update method details and optional default status."
              : "Enter card details to add a new payment method."}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nickname">
              <Input
                value={formState.nickname}
                onChange={(event) => setFormState((current) => ({ ...current, nickname: event.target.value }))}
                placeholder="Main Clinic Card"
              />
            </FormField>
            <FormField label="Cardholder">
              <Input
                value={formState.cardholder}
                onChange={(event) => setFormState((current) => ({ ...current, cardholder: event.target.value }))}
                placeholder="Cardholder name"
              />
            </FormField>
            <FormField label="Last 4 digits">
              <Input
                value={formState.last4}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    last4: event.target.value.replace(/[^\d]/g, "").slice(0, 4),
                  }))
                }
                placeholder="1234"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Exp. Month">
                <Input
                  value={formState.expiryMonth}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      expiryMonth: event.target.value.replace(/[^\d]/g, "").slice(0, 2),
                    }))
                  }
                  placeholder="09"
                />
              </FormField>
              <FormField label="Exp. Year">
                <Input
                  value={formState.expiryYear}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      expiryYear: event.target.value.replace(/[^\d]/g, "").slice(0, 4),
                    }))
                  }
                  placeholder="2028"
                />
              </FormField>
            </div>
            <FormField label="Billing Address" className="sm:col-span-2">
              <Input
                value={formState.billingAddress}
                onChange={(event) => setFormState((current) => ({ ...current, billingAddress: event.target.value }))}
                placeholder="Street, city, state"
              />
            </FormField>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
            <Checkbox
              checked={formState.makeDefault}
              onChange={(event) => setFormState((current) => ({ ...current, makeDefault: event.target.checked }))}
            />
            Make this my default payment method
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveMethod}>
              {editingMethodId ? "Save Changes" : "Add Method"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <article className="rounded-xl border border-border-soft bg-surface p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </article>
  )
}

function StatusTag({ status }: { status: SavedPaymentMethod["status"] }) {
  const tone =
    status === "default"
      ? "bg-success/15 text-success"
      : status === "backup"
        ? "bg-warning/15 text-warning"
        : "bg-surface-muted text-text-secondary"

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", tone)}>
      {status === "default" ? "Default" : status === "backup" ? "Backup" : "Active"}
    </span>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-text-secondary">{value}</p>
    </div>
  )
}

function IconButton({ icon, onClick, label }: { icon: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft text-text-muted transition-colors hover:text-brand"
    >
      {icon}
    </button>
  )
}

function FormField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <p className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      {children}
    </div>
  )
}
