"use client"

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Edit3,
  Landmark,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"
import {
  bankMethods,
  initialSavedPaymentMethods,
  paymentActivities,
  type ActivityStatus,
  type SavedPaymentMethod,
} from "./paymentMethodsData"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

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

const activityBadgeClassMap: Record<ActivityStatus, string> = {
  Completed: "bg-success/15 text-success border border-success/30",
  Scheduled: "bg-warning/15 text-warning border border-warning/30",
  Failed: "bg-danger/15 text-danger border border-danger/30",
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
  const [autoPayEnabled, setAutoPayEnabled] = useState(true)
  const [backupOnFailure, setBackupOnFailure] = useState(true)
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [approvalThreshold, setApprovalThreshold] = useState("5000")
  const [activityStatusFilter, setActivityStatusFilter] = useState<"All" | ActivityStatus>("All")
  const [activitySearch, setActivitySearch] = useState("")

  const defaultMethod = methods.find((method) => method.status === "default") ?? null
  const scheduledActivities = paymentActivities.filter((activity) => activity.status === "Scheduled")
  const scheduledAmount = scheduledActivities.reduce((total, activity) => total + activity.amount, 0)

  const filteredActivity = useMemo(() => {
    const normalizedSearch = activitySearch.trim().toLowerCase()
    return paymentActivities.filter((activity) => {
      const statusMatch = activityStatusFilter === "All" || activity.status === activityStatusFilter
      const searchMatch =
        normalizedSearch.length === 0 ||
        activity.invoiceId.toLowerCase().includes(normalizedSearch) ||
        activity.methodLabel.toLowerCase().includes(normalizedSearch)

      return statusMatch && searchMatch
    })
  }, [activitySearch, activityStatusFilter])

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
            value={currency.format(scheduledAmount)}
            hint={`${scheduledActivities.length} scheduled invoices`}
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
                  <IconButton label="Remove" onClick={() => removeMethod(method.id)} icon={<Trash2 className="h-4 w-4" />} />
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Recent Payment Activity</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                  placeholder="Search invoice id..."
                  className="h-10 w-52 pl-9"
                />
              </div>
              <select
                value={activityStatusFilter}
                onChange={(event) => setActivityStatusFilter(event.target.value as "All" | ActivityStatus)}
                className="h-10 rounded-xl border border-border-soft bg-surface-elevated px-3 text-sm text-text-primary outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border-soft">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-border-soft bg-surface-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.map((activity) => (
                  <tr key={activity.id} className="border-b border-border-soft/70 last:border-b-0">
                    <td className="px-4 py-3 text-sm text-text-secondary">{new Date(activity.date).toLocaleDateString("en-US")}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-primary">{activity.invoiceId}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{currency.format(activity.amount)}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{activity.methodLabel}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", activityBadgeClassMap[activity.status])}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-text-primary">Bank / ACH Methods</h2>
            <div className="mt-4 space-y-3">
              {bankMethods.map((bankMethod) => (
                <article key={bankMethod.id} className="rounded-xl border border-border-soft bg-surface-elevated p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand/12 p-2">
                        <Landmark className="h-4 w-4 text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{bankMethod.accountNickname}</p>
                        <p className="text-xs text-text-secondary">
                          {bankMethod.bankName} •••• {bankMethod.last4}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px] font-semibold",
                        bankMethod.verificationStatus === "Verified"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning",
                      )}
                    >
                      {bankMethod.verificationStatus}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-text-primary">Payment Rules</h2>
            <div className="mt-4 space-y-4">
              <ToggleRow
                label="Auto-pay enabled"
                description="Automatically charge due invoices using your default method."
                checked={autoPayEnabled}
                onChange={setAutoPayEnabled}
              />
              <ToggleRow
                label="Use backup method on failure"
                description="Retry failed attempts with your backup card."
                checked={backupOnFailure}
                onChange={setBackupOnFailure}
              />
              <ToggleRow
                label="Require manual approval for high-value payments"
                description="Payments above threshold will wait for approval."
                checked={requiresApproval}
                onChange={setRequiresApproval}
              />
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Approval Threshold (USD)
                </label>
                <Input
                  value={approvalThreshold}
                  onChange={(event) => setApprovalThreshold(event.target.value.replace(/[^\d]/g, ""))}
                  placeholder="5000"
                />
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => showToast.success("Rules updated", "Payment rule changes were saved.")}
              >
                <Save className="h-4 w-4" />
                Save Rules
              </Button>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-text-primary">Security & Compliance</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SecurityCard
            icon={<ShieldCheck className="h-5 w-5 text-success" />}
            title="PCI Tokenization"
            description="Card details are tokenized and never stored as raw PAN values in dashboard storage."
          />
          <SecurityCard
            icon={<AlertTriangle className="h-5 w-5 text-warning" />}
            title="Step-up Verification"
            description="Sensitive actions such as method deletion can require additional identity verification."
          />
          <SecurityCard
            icon={<Landmark className="h-5 w-5 text-brand" />}
            title="Audit Log Ready"
            description="Payment method updates and rule changes are recorded with actor and timestamp metadata."
          />
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={resetModal}
        title={editingMethodId ? "Edit Payment Method" : "Add Payment Method"}
        maxWidthClassName="max-w-xl"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-text-primary">{editingMethodId ? "Edit payment method" : "Add new payment method"}</h3>
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
                  setFormState((current) => ({ ...current, last4: event.target.value.replace(/[^\d]/g, "").slice(0, 4) }))
                }
                placeholder="1234"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Exp. Month">
                <Input
                  value={formState.expiryMonth}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, expiryMonth: event.target.value.replace(/[^\d]/g, "").slice(0, 2) }))
                  }
                  placeholder="09"
                />
              </FormField>
              <FormField label="Exp. Year">
                <Input
                  value={formState.expiryYear}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, expiryYear: event.target.value.replace(/[^\d]/g, "").slice(0, 4) }))
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

          <label className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
            <Checkbox
              checked={formState.makeDefault}
              onChange={(event) => setFormState((current) => ({ ...current, makeDefault: event.target.checked }))}
            />
            Make this my default payment method
          </label>

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

function IconButton({
  icon,
  onClick,
  label,
}: {
  icon: React.ReactNode
  onClick: () => void
  label: string
}) {
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

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface-elevated p-3">
      <label className="flex items-start gap-3">
        <Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <div>
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </label>
    </div>
  )
}

function SecurityCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <article className="rounded-xl border border-border-soft bg-surface-elevated p-4">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">{icon}</div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{description}</p>
    </article>
  )
}

function FormField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</label>
      {children}
    </div>
  )
}
