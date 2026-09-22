import { ChevronRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

// Single-row trail. On narrow screens the row scrolls sideways instead of wrapping; the
// negative margin lets scrolled content run to the screen edge (mirrors PageSectionContainer's px-4).
export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <section className={cn("border-b border-border-soft bg-canvas", className)}>
      <PageSectionContainer as="div" containerClassName="py-4">
        <nav aria-label="Breadcrumb" className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ol className="flex w-max items-center gap-2 whitespace-nowrap text-sm">
            {items.map((item, index) => {
              const isLast = index === items.length - 1
              return (
                <li key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-2">
                  {index > 0 ? <ChevronRight className="h-3 w-3 text-text-muted" aria-hidden="true" /> : null}
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="text-text-secondary transition-colors hover:text-brand hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className={isLast ? "font-medium text-text-primary" : "text-text-muted"}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </PageSectionContainer>
    </section>
  )
}
