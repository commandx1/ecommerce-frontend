"use client"

import { CreditCard } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface CardBrandIconProps {
  brand: unknown
  className?: string
}

const BRAND_LABELS = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
} as const

type KnownBrand = keyof typeof BRAND_LABELS

function normalizeBrand(brand: unknown): KnownBrand | null {
  if (typeof brand !== "string") return null
  const key = brand.toLowerCase()
  return key in BRAND_LABELS ? (key as KnownBrand) : null
}

// CSS stand-ins in each brand's colours, used until the real logo SVGs land in public/card-brands/
// (and whenever one is missing). Text-only so nothing here is an <img> the tests could mistake for
// the logo itself.
function BrandMark({ brand }: { brand: KnownBrand }) {
  switch (brand) {
    case "visa":
      return <span className="text-[13px] font-black italic tracking-tight text-[#1A1F71]">VISA</span>
    case "mastercard":
      return (
        <span className="flex items-center">
          <span className="h-5 w-5 rounded-full bg-[#EB001B]" />
          <span className="-ml-2 h-5 w-5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
        </span>
      )
    case "amex":
      return (
        <span className="rounded-[3px] bg-[#006FCF] px-1 py-0.5 text-[8px] font-black leading-none tracking-wide text-white">
          AMEX
        </span>
      )
    case "discover":
      return (
        <span className="flex items-center gap-0.5 text-[8px] font-black leading-none tracking-tight text-[#231F20]">
          DISC
          <span className="h-2 w-2 rounded-full bg-[#F76F20]" />
          VER
        </span>
      )
  }
}

export default function CardBrandIcon({ brand, className }: CardBrandIconProps) {
  const key = normalizeBrand(brand)
  // Tracks which brand failed rather than a boolean, so one missing file doesn't hide the others.
  const [failedKey, setFailedKey] = useState<KnownBrand | null>(null)

  const showLogo = key !== null && failedKey !== key

  return (
    <span
      className={`inline-flex h-8 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-soft bg-white ${className ?? ""}`}
    >
      {showLogo ? (
        <Image
          src={`/card-brands/${key}.svg`}
          alt={BRAND_LABELS[key]}
          width={48}
          height={32}
          unoptimized
          className="h-full w-full object-contain p-1"
          onError={() => setFailedKey(key)}
        />
      ) : key ? (
        <BrandMark brand={key} />
      ) : (
        <CreditCard aria-hidden className="h-5 w-5 text-text-muted" />
      )}
    </span>
  )
}
