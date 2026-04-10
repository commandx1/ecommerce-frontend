import { Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  title: string
  category: string
  description: string
  price: string
  originalPrice: string | null
  image: string
  alt: string
  href: string
}

export default function ProductCard({
  title,
  category,
  description,
  price,
  originalPrice,
  image,
  alt,
  href,
}: ProductCardProps) {
  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-border-soft bg-surface-elevated shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel">
      <Link href={href} className="block">
        <div className="h-52 overflow-hidden bg-surface">
          <Image
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            src={image}
            alt={alt}
            width={400}
            height={192}
          />
        </div>
      </Link>
      <div className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full border border-border-soft bg-surface px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {category}
          </span>
          <button
            type="button"
            className="text-text-muted transition-colors hover:text-danger"
            aria-label="Add to favorites"
          >
            <Heart className="h-5 w-5" fill="none" stroke="currentColor" />
          </button>
        </div>
        <Link href={href} className="block">
          <h3 className="mb-2 text-xl font-semibold text-text-primary hover:text-brand">{title}</h3>
          <p className="mb-4 text-sm leading-6 text-text-secondary">{description}</p>
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-2xl font-semibold text-brand">{price}</span>
            {originalPrice ? <span className="ml-2 text-sm text-text-muted line-through">{originalPrice}</span> : null}
          </div>
          <Link
            href={href}
            className="inline-block rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
