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
  /** Above-the-fold cards: preload instead of lazy-loading. */
  priority?: boolean
  className?: string
}

export default function CategoryCard({
  title,
  description,
  productCount,
  image,
  eyebrow = "Category",
  href = "/products",
  featured = false,
  priority = false,
  className,
}: CategoryCardProps) {
  return (
    <SpotlightCard
      radius={28}
      className={cn(
        "group h-full rounded-[1.75rem] shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel",
        className,
      )}
    >
      <Link
        href={href}
        className={cn(
          "relative block h-full overflow-hidden rounded-[1.75rem] bg-surface-elevated",
          featured ? "min-h-[26rem]" : "min-h-[23.5rem]",
        )}
      >
        <div className={cn("relative overflow-hidden bg-[#EEF2F6]", featured ? "h-72 md:h-[22rem]" : "aspect-[4/3]")}>
          <Image
            src={image}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className={`relative ${featured ? "p-7 md:p-8" : "p-6"}`}>
          <div className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-text-muted">{eyebrow}</div>
          <h3
            className={`${featured ? "text-3xl md:text-[2rem]" : "min-h-[3.5rem] text-2xl"} mb-2 font-semibold text-text-primary`}
          >
            {title}
          </h3>
          <p
            className={`mb-4 max-w-xl text-sm leading-6 text-text-secondary md:text-[0.95rem] ${featured ? "" : "min-h-[4.5rem]"}`}
          >
            {description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{productCount} products</span>
            <ArrowUpRight className="h-5 w-5 text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </SpotlightCard>
  )
}
