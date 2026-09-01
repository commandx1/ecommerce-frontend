import type { VariantAttributeGroup, VariantAttributeValue, VariantChoice } from "../types"

// numeric: true so "8.5 gram" sorts before "200 tips" instead of after it (plain string
// comparison would put "1" ahead of "8" character-by-character).
const collator = new Intl.Collator(undefined, { numeric: true })

const byCollator = (a: string, b: string) => collator.compare(a, b)

/**
 * Folds a variant attribute's raw value rows into one chip per `value`. The backend doesn't
 * dedupe rows that share a value but belong to different products ("ambiguous" variants -
 * SVC:1029 short-circuit), so without this step the same value would render as multiple chips.
 */
export const toVariantChoices = (values: unknown): VariantChoice[] => {
  // Array.isArray, not a truthy check: same defensive pattern as buildSpecifications/buildPhotoPaths
  // in productDetailTransforms.ts - a malformed 200 body can send `values` as a non-array.
  if (!Array.isArray(values)) return []

  const byValue = new Map<string, VariantChoice>()

  for (const row of values as VariantAttributeValue[]) {
    if (!row || typeof row !== "object") continue
    const value = typeof row.value === "string" ? row.value.trim() : ""
    if (!value) continue

    const name = typeof row.name === "string" ? row.name.trim() : ""
    const existing = byValue.get(value)

    if (!existing) {
      byValue.set(value, {
        value,
        selected: Boolean(row.selected),
        option: Boolean(row.option),
        available: Boolean(row.available),
        names: name ? [name] : [],
      })
      continue
    }

    // The most optimistic row wins: if any row for this value is selected/option/available,
    // the chip is too - the user should still get to try a path that exists for at least one
    // of the products sharing this value.
    existing.selected = existing.selected || Boolean(row.selected)
    existing.option = existing.option || Boolean(row.option)
    existing.available = existing.available || Boolean(row.available)
    if (name && !existing.names.includes(name)) existing.names.push(name)
  }

  return [...byValue.values()]
    .map((choice) => ({ ...choice, names: [...choice.names].sort(byCollator) }))
    .sort((a, b) => byCollator(a.value, b.value))
}

/** Attribute groups arrive in no particular order (no ORDER BY on the backend query). */
export const sortVariantGroups = (groups: unknown): VariantAttributeGroup[] => {
  if (!Array.isArray(groups)) return []

  return (groups as VariantAttributeGroup[])
    .filter((group): group is VariantAttributeGroup => Boolean(group) && typeof group === "object")
    .slice()
    .sort((a, b) => byCollator(a.attribute ?? "", b.attribute ?? ""))
}
