/**
 * The single rule for whether a heavy-shipment surcharge is shown anywhere in the app: only when
 * it is a finite, positive number. Zero, negative, missing, or non-finite (`NaN`/`Infinity`)
 * values mean "no heavy fee" and the whole line/row/badge for it must not render.
 */
export function hasHeavyShipmentFee(fee: number | null | undefined): fee is number {
  return typeof fee === "number" && Number.isFinite(fee) && fee > 0
}
