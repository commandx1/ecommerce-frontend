import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  title: string
  description: string
  productCount: string
  image: string
  eyebrow?: string
  href?: string
  featured?: boolean
  /** Highlights the eyebrow pill in brand colour (e.g. the single "Most stocked" card). */
  accent?: boolean
  /** Above-the-fold cards: preload instead of lazy-loading. */
  priority?: boolean
  className?: string
}

/**
 * Featured category card: photo sits in a rounded "mat" inside the card, with the product
 * count and eyebrow as pills over the image, and a persistent call-to-action row at the bottom.
 */
export default function CategoryCard({
  title,
  description,
  productCount,
  image,
  eyebrow = "Category",
  href = "/products",
  featured = false,
  accent = false,
  priority = false,
  className,
}: CategoryCardProps) {
  return (
    <SpotlightCard
      radius={28}
      className={cn(
        "group h-full rounded-[1.75rem] shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-panel",
        className,
      )}
    >
      <Link
        href={href}
        className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated p-2 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.25rem] bg-[#EEF2F6]",
            featured ? "h-72 md:h-[22rem]" : "aspect-[4/3]",
          )}
        >
          <Image
            src={image}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <span className="absolute left-3 top-3 z-10 inline-flex h-7 items-center rounded-full bg-white/85 px-3 text-[0.72rem] font-semibold tabular-nums text-[#0F172A] shadow-sm ring-1 ring-black/5 backdrop-blur">
            {productCount} products
          </span>
          <span
            className={cn(
              "absolute right-3 top-3 z-10 inline-flex h-7 items-center rounded-full px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] shadow-sm ring-1 ring-black/5 backdrop-blur",
              accent ? "bg-brand text-white" : "bg-white/85 text-text-secondary",
            )}
          >
            {eyebrow}
          </span>
        </div>

        <div className={cn("flex flex-1 flex-col px-3 pb-3", featured ? "pt-5" : "pt-4")}>
          <h3
            className={cn(
              "font-display leading-[1.12] tracking-[-0.02em] text-text-primary",
              featured ? "text-3xl md:text-[2rem]" : "text-[1.45rem]",
            )}
          >
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-[1.4rem] text-text-secondary">
            {description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="text-sm font-semibold text-brand">Browse category</span>
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface-elevated text-brand transition-colors duration-200 group-hover:border-brand group-hover:bg-brand group-hover:text-white"
            >
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </SpotlightCard>
  )
}
