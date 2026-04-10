import { Award, type LucideIcon, Percent, Shield, TrendingUp, Truck } from "lucide-react"

const BENEFITS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Shield, label: "Verified professional network" },
  { icon: Percent, label: "Exclusive professional pricing" },
  { icon: Truck, label: "Priority shipping & support" },
  { icon: Award, label: "Access to certified suppliers" },
  { icon: TrendingUp, label: "Practice management tools" },
]

const STATS: Array<{ value: string; label: string }> = [
  { value: "10,000+", label: "Verified Dentists" },
  { value: "500+", label: "Certified Suppliers" },
  { value: "50,000+", label: "Products Available" },
  { value: "99.8%", label: "Satisfaction Rate" },
]

export default function RegisterSidebar() {
  return (
    <div className="flex flex-col justify-center bg-linear-to-br from-brand-surface via-brand to-brand-strong p-12 dark:from-surface dark:via-surface-elevated dark:to-surface-muted">
      <div className="mb-8 text-inverse-foreground">
        <h2 className="mb-4 text-3xl font-bold text-inverse-muted">Join the Professional Network</h2>
        <p className="mb-6 text-lg leading-relaxed text-inverse-muted">
          Connect with thousands of verified dental professionals and access exclusive pricing, certified suppliers, and
          industry-leading products.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center text-inverse-foreground">
            <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent-strong/90 dark:bg-brand/20">
              <Icon className="h-4 w-4 text-brand-strong dark:text-accent-strong" />
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-inverse-foreground/15 bg-inverse-foreground/10 p-6 backdrop-blur-sm dark:border-border-soft/70 dark:bg-surface/70">
        <h3 className="mb-4 text-lg font-semibold text-inverse-foreground">Trusted by Professionals</h3>
        <div className="grid grid-cols-2 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-accent-strong">{value}</div>
              <div className="text-sm text-inverse-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
