import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "./Logo"

const PRODUCT_LINKS = [
  ["Dental Instruments", "/dental-instruments"],
  ["Restorative Materials", "/restorative-materials"],
  ["Digital Imaging", "/digital-imaging"],
  ["Orthodontics", "/orthodontics"],
  ["Lab Equipment", "/lab-equipment"],
  ["Office Equipment", "/office-equipment"],
] as const

const SERVICE_LINKS = [
  ["Supplier Network", "/supplier-network"],
  ["Lab Services", "/lab-services"],
  ["Equipment Installation", "/equipment-installation"],
  ["Training Programs", "/training-programs"],
  ["Technical Support", "/technical-support"],
  ["Financing Options", "/financing-options"],
] as const

const SUPPORT_LINKS = [
  ["Legal", "/legal"],
  ["Help Center", "/help-center"],
  ["Contact Us", "/contact-us"],
  ["Order Tracking", "/order-tracking"],
  ["Returns & Exchanges", "/returns-and-exchanges"],
  ["Shipping Information", "/shipping-information"],
  ["Account Management", "/account-management"],
] as const

const POLICY_LINKS = [
  ["Privacy Policy", "/privacy-policy"],
  ["Terms of Service", "/terms-of-service"],
  ["HIPAA Compliance", "/hipaa-compliance"],
  ["Cookie Policy", "/cookie-policy"],
] as const

const SOCIAL_LINKS = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { icon: Twitter, label: "X", href: "https://x.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
] as const

function FooterLinkColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-text-primary dark:text-inverse-foreground">{title}</h3>
      <ul className="space-y-3">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-text-secondary transition-colors hover:text-brand dark:text-inverse-muted dark:hover:text-inverse-foreground"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const Footer = () => {
  return (
    <footer className="border-t border-border-soft bg-surface-muted/75 dark:bg-brand-surface">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 gap-8 py-16 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <Logo />
              <div>
                <span className="block font-display text-3xl font-semibold text-text-primary dark:text-inverse-foreground">
                  DentyPro
                </span>
                <span className="mt-1 block text-[0.7rem] uppercase tracking-[0.28em] text-text-muted dark:text-inverse-muted">
                  Clinical Supply Network
                </span>
              </div>
            </div>

            <p className="mb-6 max-w-xl leading-relaxed text-text-secondary dark:text-inverse-muted">
              The leading B2B marketplace for dental professionals in the United States. Connect with verified
              suppliers, access competitive pricing, and streamline your practice procurement.
            </p>

            <div className="mb-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-border-soft bg-surface-elevated px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-text-primary dark:border-white/14 dark:bg-white/12 dark:text-inverse-foreground">
                Verified sourcing
              </span>
              <span className="rounded-full border border-border-soft bg-surface-elevated px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-text-primary dark:border-white/14 dark:bg-white/12 dark:text-inverse-foreground">
                HIPAA-aware support
              </span>
              <span className="rounded-full border border-border-soft bg-surface-elevated px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-text-primary dark:border-white/14 dark:bg-white/12 dark:text-inverse-foreground">
                Procurement ready
              </span>
            </div>

            <div className="flex gap-4">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <Button
                  key={label}
                  asChild
                  size="icon"
                  variant="quiet"
                  className="border border-border-soft bg-surface-elevated text-text-primary hover:border-brand/25 hover:bg-surface hover:text-brand dark:border-white/14 dark:bg-white/12 dark:text-inverse-foreground dark:hover:border-white/22 dark:hover:bg-white/18 dark:hover:text-inverse-foreground"
                >
                  <Link href={href} aria-label={label}>
                    <Icon />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <FooterLinkColumn title="Products" links={PRODUCT_LINKS} />
          <FooterLinkColumn title="Services" links={SERVICE_LINKS} />
          <FooterLinkColumn title="Support" links={SUPPORT_LINKS} />
        </div>

        <div className="mt-4 border-t border-border-soft py-8 dark:border-white/10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-wrap justify-center gap-6 md:justify-start">
              {POLICY_LINKS.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-text-muted transition-colors hover:text-brand dark:text-inverse-muted dark:hover:text-inverse-foreground"
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="text-sm text-text-muted dark:text-inverse-muted">© 2026 DentyPro. All rights reserved.</div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
