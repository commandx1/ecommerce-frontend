import { ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

export default function HomeFinalCtaSection() {
  return (
    <PageSectionContainer as="section" className="relative pt-2 pb-20">
      <div className="home-spotlight rounded-[2rem] border border-border-soft/75 bg-[linear-gradient(124deg,color-mix(in_oklab,var(--brand)_12%,var(--surface))_0%,color-mix(in_oklab,var(--accent-strong)_15%,var(--surface-elevated))_100%)] p-8 sm:p-10">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border-soft/85 bg-surface/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.19em] text-text-secondary">
              <ShieldCheck className="h-3.5 w-3.5" />
              B2B-ready checkout and trust signals
            </p>
            <h2 className="mt-4 max-w-[18ch] font-display text-3xl leading-[1.05] text-text-primary sm:text-4xl md:text-5xl">
              Ready to place your next clinic order?
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 hover:bg-brand-strong"
          >
            Start Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PageSectionContainer>
  )
}
