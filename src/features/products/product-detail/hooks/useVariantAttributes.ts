"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { fetchVariantAttributes, matchVariantAttribute } from "@/lib/api/variant-attributes"
import type { VariantChoice } from "../types"
import { sortVariantGroups, toVariantChoices } from "../utils/variantAttributeTransforms"

export type VariantAttributesStatus = "loading" | "ready" | "empty"

export interface VariantChoiceGroup {
  attribute: string
  choices: VariantChoice[]
}

export interface SelectVariantParams {
  attribute: string
  value: string
  productName?: string
}

export function useVariantAttributes(productId: string) {
  const router = useRouter()
  const [status, setStatus] = useState<VariantAttributesStatus>("loading")
  const [groups, setGroups] = useState<VariantChoiceGroup[]>([])
  const [pendingValue, setPendingValue] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus("loading")
    setGroups([])

    fetchVariantAttributes(productId)
      .then((response) => {
        if (cancelled) return

        const nextGroups = sortVariantGroups(response?.attributes)
          .map((group) => ({ attribute: group.attribute, choices: toVariantChoices(group.values) }))
          .filter((group) => group.choices.length > 0)

        if (nextGroups.length === 0) {
          setStatus("empty")
          return
        }
        setGroups(nextGroups)
        setStatus("ready")
      })
      .catch(() => {
        // Every backend failure is HTTP 400, including "this product has no variants" - a fetch
        // error can't be told apart from "no variants exist", so this fails silently instead of
        // toasting an error for what is very often a perfectly ordinary, variant-less product.
        if (!cancelled) setStatus("empty")
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  const select = useCallback(
    async ({ attribute, value, productName }: SelectVariantParams) => {
      setPendingValue(value)
      try {
        const result = await matchVariantAttribute({
          productId,
          chosenAttribute: attribute,
          chosenAttributeValue: value,
          productName,
        })
        // A 200 with a body that is not ProductWithUserProductsDto would otherwise surface a raw
        // TypeError ("Cannot read properties of undefined") in the toast - give the user a real message.
        const nextProductId = result?.product?.id
        if (typeof nextProductId !== "string" || nextProductId.length === 0) {
          throw new Error("Please try again.")
        }
        router.push(`/products/${nextProductId}`)
      } catch (error) {
        // Unlike the initial fetch, this failure follows a deliberate click - the user needs to
        // know it didn't work, so (unlike fetchVariantAttributes above) this one does toast.
        const message = error instanceof Error && error.message ? error.message : "Please try again."
        showToast.error("Couldn't switch variant", message)
      } finally {
        setPendingValue(null)
      }
    },
    [productId, router],
  )

  return { status, groups, pendingValue, select }
}
