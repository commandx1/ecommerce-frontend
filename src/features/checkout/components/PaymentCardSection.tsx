"use client"

import { Plus, Repeat, X } from "lucide-react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { useState } from "react"
import CardBrandIcon from "@/components/payments/CardBrandIcon"
import { Skeleton } from "@/components/ui/skeleton"
import NewCardForm from "@/features/checkout/components/NewCardForm"
import { isCardExpired, pickInitialCardId } from "@/features/checkout/lib/saved-card-utils"
import type { SavedCard } from "@/lib/api/orders"
import type { PendingNewCard } from "@/stores/checkoutStore"

interface PaymentCardSectionProps {
  cardName: string
  isLoadingCards: boolean
  isSubmitting: boolean
  saveCard: boolean
  savedCards: SavedCard[]
  selectedSavedCardId: string
  pendingNewCard: PendingNewCard | null
  showInlineNewCardForm: boolean
  setCardName: (value: string) => void
  setSaveCard: (value: boolean) => void
  setSelectedSavedCardId: (value: string) => void
  /** True when the cart contains at least one item set to repeat. */
  hasAutoOrderItems: boolean
  autoOrderConsent: boolean
  setAutoOrderConsent: (value: boolean) => void
  newCardAutoPaymentConsent: boolean
  setNewCardAutoPaymentConsent: (value: boolean) => void
  setPendingNewCard: (card: PendingNewCard | null) => void
}

// The backend field is `String`/`Integer` (nullable), but props are trusted at the type level
// only — a broken/wrong-typed value must never surface as the literal "null"/"NaN"/"undefined"
// text a raw `.toUpperCase()`/template interpolation would otherwise produce (see F101).
function formatCardBrand(brand: unknown): string {
  return typeof brand === "string" ? brand.toUpperCase() : ""
}

function formatExpiryPart(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "--"
}

function CardBadge({ label, tone }: { label: string; tone: "brand" | "success" | "neutral" | "danger" }) {
  const toneClass =
    tone === "brand"
      ? "bg-brand/15 text-brand"
      : tone === "success"
        ? "bg-success/15 text-success"
        : tone === "danger"
          ? "bg-danger/15 text-danger"
          : "bg-surface-muted text-text-muted"

  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>{label}</span>
}

const listVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

// Mirrors the anatomy of a real card row (brand chip · title + badge · expiry line · selection
// dot) so the list doesn't jump when the data lands. Shimmer comes from the shared
// `Skeleton` primitive; the global reduced-motion rule already freezes it.
function CardListSkeleton() {
  return (
    <output aria-busy="true" aria-live="polite" className="block space-y-3">
      <span className="sr-only">Loading saved cards...</span>
      {[0, 1].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="flex items-center gap-4 rounded-lg border border-border-soft p-4"
          style={{ opacity: row === 0 ? 1 : 0.55 }}
        >
          <Skeleton className="h-8 w-12 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36 max-w-[55%] rounded" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-44 max-w-[70%] rounded" />
          </div>
          <div className="h-6 w-6 shrink-0 rounded-full border-2 border-border-soft" />
        </div>
      ))}
    </output>
  )
}

// Selected = brand border plus a 2px outer ring (no fill), like the reference selector; the ring
// is a box-shadow so it never nudges the layout. Keyboard focus on the hidden radio lights the row.
function rowClass(state: "selected" | "idle" | "expired") {
  const base =
    "flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40"
  if (state === "expired") return `${base} cursor-not-allowed border-border-soft opacity-60`
  if (state === "selected") return `${base} cursor-pointer border-brand shadow-[0_0_0_2px_var(--brand)]`
  return `${base} cursor-pointer border-border-soft hover:bg-surface-muted/50`
}

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
        selected ? "border-brand" : "border-border-strong"
      }`}
    >
      <AnimatePresence>
        {selected ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="h-3 w-3 rounded-full bg-brand"
          />
        ) : null}
      </AnimatePresence>
    </span>
  )
}

export default function PaymentCardSection({
  cardName,
  isLoadingCards,
  isSubmitting,
  saveCard,
  savedCards,
  selectedSavedCardId,
  pendingNewCard,
  showInlineNewCardForm,
  setCardName,
  setSaveCard,
  setSelectedSavedCardId,
  hasAutoOrderItems,
  autoOrderConsent,
  setAutoOrderConsent,
  newCardAutoPaymentConsent,
  setNewCardAutoPaymentConsent,
  setPendingNewCard,
}: PaymentCardSectionProps) {
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const isNewCard = selectedSavedCardId === ""
  // Panel shows itself whenever there is no usable saved card to fall back to (showInlineNewCardForm),
  // or the buyer explicitly opened it and hasn't tokenized a card yet.
  const isPanelOpen = showInlineNewCardForm || (isAddCardOpen && isNewCard && !pendingNewCard)

  // Backend: `OrderMapper.toSavedCardResponse` returns `null` for a null `SavedCard` entity, and
  // that `null` is collected straight into the list handed back to the client
  // (`CardManagementService`/`OrderQueryService`, both `.stream().map(orderMapper::toSavedCardResponse)`).
  // A malformed/non-array prop is guarded the same way, matching the pattern used everywhere else
  // list fields come back from this backend.
  const validSavedCards = Array.isArray(savedCards) ? savedCards.filter((card): card is SavedCard => card != null) : []

  const selectedCard = validSavedCards.find((card) => card.stripeCardId === selectedSavedCardId)

  // A card that already carries an off-session mandate can cover auto orders as
  // is; one that does not needs the buyer to allow future automatic charges.
  const needsSavedCardConsent = hasAutoOrderItems && !isNewCard && !selectedCard?.openToAutoPayment
  const savedCardAlreadyOpen = hasAutoOrderItems && !isNewCard && Boolean(selectedCard?.openToAutoPayment)

  const openPanel = () => {
    setIsAddCardOpen(true)
    setSelectedSavedCardId("")
    setAutoOrderConsent(false)
    // Opening the panel again always starts from a blank form — a previously tokenized card
    // waiting to be picked up is dropped (deliberate: "Add new method" means starting over).
    setPendingNewCard(null)
  }

  const closePanel = () => {
    setIsAddCardOpen(false)
    setSelectedSavedCardId(pickInitialCardId(validSavedCards))
    setAutoOrderConsent(false)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="rounded-xl border border-border-soft bg-surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h3 className="whitespace-nowrap text-lg font-semibold text-text-primary">Payment Method</h3>
          {!isLoadingCards && !showInlineNewCardForm ? (
            <button
              type="button"
              aria-expanded={isPanelOpen}
              disabled={isSubmitting}
              onClick={() => (isPanelOpen ? closePanel() : openPanel())}
              className="flex items-center gap-1 whitespace-nowrap rounded-md text-sm font-medium text-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
            >
              {isPanelOpen ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add new method
                </>
              )}
            </button>
          ) : null}
        </div>

        <div className="text-sm text-text-secondary">
          <div className="space-y-4">
            {hasAutoOrderItems ? (
              <div className="flex items-start gap-2 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2">
                <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <p className="text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">This order includes auto order items.</span> The
                  card you use here becomes your auto order card and will be charged automatically for future
                  deliveries.
                </p>
              </div>
            ) : null}

            {isLoadingCards ? (
              <CardListSkeleton />
            ) : (
              <>
                {validSavedCards.length > 0 || pendingNewCard ? (
                  <motion.div
                    role="radiogroup"
                    aria-label="Payment cards"
                    className="space-y-4"
                    variants={listVariants}
                    initial="initial"
                    animate="animate"
                  >
                    {validSavedCards.map((card) => {
                      const expired = isCardExpired(card)
                      const selected = selectedSavedCardId === card.stripeCardId
                      return (
                        <motion.label
                          key={card.id}
                          variants={itemVariants}
                          className={rowClass(expired ? "expired" : selected ? "selected" : "idle")}
                        >
                          <input
                            type="radio"
                            name="saved-card"
                            checked={selected}
                            disabled={expired}
                            onChange={() => {
                              setSelectedSavedCardId(card.stripeCardId)
                              setAutoOrderConsent(false)
                              setIsAddCardOpen(false)
                            }}
                            className="sr-only"
                          />
                          <CardBrandIcon brand={card.brand} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-medium text-text-primary">
                                {formatCardBrand(card.brand)} •••• {card.last4}
                              </span>
                              {card.isDefault ? <CardBadge label="Default" tone="neutral" /> : null}
                              {card.autoOrderCard ? <CardBadge label="Auto order card" tone="brand" /> : null}
                              {card.openToAutoPayment ? <CardBadge label="Auto payments on" tone="success" /> : null}
                              {expired ? <CardBadge label="Expired" tone="danger" /> : null}
                            </div>
                            <div className="truncate text-sm text-text-muted">
                              Expires {formatExpiryPart(card.expMonth)}/{formatExpiryPart(card.expYear)}
                              {card.name ? ` · ${card.name}` : null}
                            </div>
                          </div>
                          <SelectionDot selected={selected} />
                        </motion.label>
                      )
                    })}

                    {pendingNewCard ? (
                      <motion.label variants={itemVariants} className={rowClass(isNewCard ? "selected" : "idle")}>
                        <input
                          type="radio"
                          name="saved-card"
                          checked={isNewCard}
                          onChange={() => {
                            setSelectedSavedCardId("")
                            setAutoOrderConsent(false)
                          }}
                          className="sr-only"
                        />
                        <CardBrandIcon brand={pendingNewCard.brand} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-medium text-text-primary">
                              {pendingNewCard.brand ? formatCardBrand(pendingNewCard.brand) : "NEW CARD"} ••••{" "}
                              {pendingNewCard.last4}
                            </span>
                            <CardBadge label="New" tone="brand" />
                          </div>
                          <div className="truncate text-sm text-text-muted">
                            Expires {formatExpiryPart(pendingNewCard.expMonth)}/
                            {formatExpiryPart(pendingNewCard.expYear)}
                            {(saveCard || hasAutoOrderItems) && cardName.trim() ? ` · ${cardName}` : null}
                          </div>
                        </div>
                        <SelectionDot selected={isNewCard} />
                      </motion.label>
                    ) : null}
                  </motion.div>
                ) : null}

                <AnimatePresence initial={false}>
                  {isPanelOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 rounded-lg border border-dashed border-border-strong bg-surface-muted/60 p-4">
                        {validSavedCards.length > 0 || pendingNewCard ? (
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">New card</p>
                        ) : (
                          <p className="text-xs text-text-muted">Add a card to continue.</p>
                        )}
                        <NewCardForm
                          cardName={cardName}
                          setCardName={setCardName}
                          saveCard={saveCard}
                          setSaveCard={setSaveCard}
                          hasAutoOrderItems={hasAutoOrderItems}
                          newCardAutoPaymentConsent={newCardAutoPaymentConsent}
                          setNewCardAutoPaymentConsent={setNewCardAutoPaymentConsent}
                        />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Continue to Review tokenizes inline: useBillingInformation's onSubmit already
                    falls through to the Stripe tokenize step whenever selectedSavedCardId === ""
                    and there is no pendingNewCard yet — no extra wiring needed here. */}

                {savedCardAlreadyOpen ? (
                  <div className="rounded-lg border border-border-soft bg-surface-elevated px-3 py-2 text-xs text-text-secondary">
                    This card is already set up for automatic payments and will become your auto order card.
                  </div>
                ) : null}

                {needsSavedCardConsent ? (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={autoOrderConsent}
                        onChange={(event) => setAutoOrderConsent(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                      />
                      <span>
                        Allow this card to be charged automatically for my auto orders, even when I'm not on the site.
                        <span className="mt-1 block text-xs text-text-secondary">
                          Required to place this order. You can withdraw it anytime from Payment Methods.
                        </span>
                      </span>
                    </label>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
