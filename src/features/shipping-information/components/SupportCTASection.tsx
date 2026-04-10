import { Headphones, Mail, Phone } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

const SUPPORT_ACTIONS = [
  {
    icon: Headphones,
    label: "Live Chat Support",
    variant: "primary",
  },
  {
    icon: Phone,
    label: "Call: (855) 334-6825",
    variant: "secondary",
  },
  {
    icon: Mail,
    label: "Email Support",
    variant: "secondary",
  },
] as const

const SUPPORT_ACTION_CLASS: Record<(typeof SUPPORT_ACTIONS)[number]["variant"], string> = {
  primary:
    "flex items-center justify-center gap-2 rounded-xl bg-accent-strong px-6 py-4 text-sm font-semibold text-brand-strong transition-colors hover:brightness-95 sm:text-base",
  secondary:
    "flex items-center justify-center gap-2 rounded-xl border border-inverse-muted/20 bg-brand/20 px-6 py-4 text-sm font-semibold text-inverse-foreground transition-colors hover:bg-brand/30 sm:text-base",
}

export default function SupportCTASection() {
  return (
    <section className="bg-surface py-12 sm:py-16 lg:py-20">
      <PageSectionContainer as="div" containerClassName="max-w-4xl">
        <div className="rounded-3xl border border-border-soft bg-brand-surface px-6 py-10 text-center sm:px-10 sm:py-12">
          <h2 className="mb-4 text-2xl font-bold text-inverse-foreground sm:mb-6 sm:text-3xl lg:text-4xl">
            Need Shipping Assistance?
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-inverse-muted sm:mb-12 sm:text-xl">
            Our logistics team is here to help with shipping questions, custom delivery arrangements, and bulk order
            coordination
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {SUPPORT_ACTIONS.map(({ icon: Icon, label, variant }) => (
              <button key={label} type="button" className={SUPPORT_ACTION_CLASS[variant]}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}
