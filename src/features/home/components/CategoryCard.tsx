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
  alt: string
  eyebrow?: string
  href?: string
  featured?: boolean
  className?: string
}

export default function CategoryCard({
  title,
  description,
  productCount,
  image,
  alt,
  eyebrow = "Category",
  href = "/products",
  featured = false,
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
        <div className={`${featured ? "h-72 md:h-[22rem]" : "h-48"} overflow-hidden bg-surface-muted`}>
          <Image
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={image}
            alt={alt}
            width={featured ? 800 : 400}
            height={featured ? 480 : 192}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,color-mix(in_oklab,var(--brand-strong)_34%,transparent)_100%)] opacity-80" />
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
