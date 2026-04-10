import { ArrowRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import type { HomeBuyLaneItem } from "@/features/home/types"

interface HomeBuyLaneSectionProps {
  items: ReadonlyArray<HomeBuyLaneItem>
}

export default function HomeBuyLaneSection({ items }: HomeBuyLaneSectionProps) {
  return (
    <PageSectionContainer as="section" className="relative py-14 lg:py-18">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.title}
              className="home-spotlight rounded-[1.6rem] border border-border-soft/80 bg-surface/82 p-6 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--brand)_12%,var(--surface))] text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-2xl font-display leading-tight text-text-primary">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                {item.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          )
        })}
      </div>
    </PageSectionContainer>
  )
}
