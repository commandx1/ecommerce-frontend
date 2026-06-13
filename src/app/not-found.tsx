import {
  Armchair,
  ArrowRight,
  Box,
  ChevronDown,
  FlaskConical,
  Headset,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  Microscope,
  Phone,
  Scan,
  Store,
  Syringe,
  Tag,
  UserCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* 404 Main Section */}
      <section className="flex min-h-[80vh] items-center justify-center py-16">
        <PageSectionContainer as="div" containerClassName="w-full">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="mb-8">
                <div className="mb-6 inline-block rounded-2xl bg-danger/10 px-6 py-3">
                  <span className="text-lg font-bold text-danger">Error 404</span>
                </div>
                <h1 className="mb-6 text-6xl leading-tight font-bold text-text-primary lg:text-7xl">
                  Oops! Page Not Found
                </h1>
                <p className="mb-8 text-xl leading-relaxed text-text-secondary">
                  The page you're looking for doesn't exist or has been moved. Don't worry, we'll help you get back on
                  track to finding the dental supplies you need.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/"
                  className="flex items-center rounded-full bg-brand px-8 py-4 font-semibold text-primary-foreground transition-colors hover:bg-brand-strong"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center rounded-full border border-border-strong bg-surface-elevated px-8 py-4 font-semibold text-brand transition-colors hover:border-brand/40 hover:bg-accent"
                >
                  <Headset className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="relative">
                <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-accent-strong/20" />
                <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-danger/16" />
                <div className="relative rounded-4xl border border-border-soft bg-surface-elevated p-12 text-center shadow-panel">
                  <div className="mx-auto mb-8 flex h-64 w-64 items-center justify-center">
                    <div className="relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse text-9xl font-bold text-brand/14">
                        404
                      </div>{" "}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-text-muted">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm italic">You seem to be lost</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageSectionContainer>
      </section>

      {/* Popular Pages */}
      <section className="bg-canvas py-16">
        <PageSectionContainer as="div">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-text-primary">Popular Pages</h2>
            <p className="text-lg text-text-secondary">Here are some pages you might be looking for</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Box,
                title: "All Products",
                desc: "Browse our complete catalog of dental supplies",
                link: "/products",
                btnText: "View Products",
              },
              {
                icon: Store,
                title: "Vendors",
                desc: "Find verified dental vendors",
                link: "/vendors",
                btnText: "Browse Vendors",
              },
              {
                icon: Tag,
                title: "Top Deals",
                desc: "Explore current promotions and discounts",
                link: "/top-deals",
                btnText: "View Deals",
              },
              {
                icon: UserCircle,
                title: "My Account",
                desc: "Manage your orders and profile",
                link: "/buyer-dashboard",
                btnText: "Go to Account",
              },
            ].map((page) => (
              <Link
                key={page.title}
                href={page.link}
                className="group rounded-3xl border border-border-soft bg-surface-elevated p-6 transition-shadow hover:shadow-soft"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-primary-foreground transition-transform group-hover:scale-110">
                  <page.icon className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{page.title}</h3>
                <p className="mb-3 text-sm text-text-secondary">{page.desc}</p>
                <div className="flex items-center text-sm font-medium text-brand">
                  {page.btnText} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </PageSectionContainer>
      </section>

      {/* Categories */}
      <section className="bg-surface-muted/45 py-16">
        <PageSectionContainer as="div">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-text-primary">Browse by Category</h2>
            <p className="text-lg text-text-secondary">Find what you need in our organized product categories</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Syringe, title: "Instruments", link: "/products?category=instruments" },
              { icon: FlaskConical, title: "Materials", link: "/products?category=materials" },
              { icon: Scan, title: "Imaging", link: "/products?category=imaging" },
              { icon: Box, title: "Orthodontics", link: "/products?category=orthodontics" },
              { icon: Microscope, title: "Lab Equipment", link: "/products?category=lab" },
              { icon: Armchair, title: "Office", link: "/products?category=office" },
            ].map((cat) => (
              <Link
                key={cat.title}
                href={cat.link}
                className="group rounded-[1.35rem] border border-border-soft bg-surface-elevated p-6 text-center transition-shadow hover:shadow-soft"
              >
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-brand transition-all group-hover:scale-110 group-hover:bg-brand group-hover:text-primary-foreground">
                  <cat.icon className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{cat.title}</h3>
              </Link>
            ))}
          </div>
        </PageSectionContainer>
      </section>

      {/* Help Section */}
      <section className="bg-canvas py-16">
        <PageSectionContainer as="div">
          <div className="overflow-hidden rounded-4xl bg-brand text-inverse-foreground shadow-panel dark:bg-brand-surface">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="p-12 text-inverse-foreground">
                <h2 className="text-4xl font-bold mb-6">Need Help?</h2>
                <p className="mb-8 text-lg leading-relaxed text-inverse-muted">
                  Our support team is here to assist you 24/7. Whether you have questions about products, orders, or
                  your account, we're ready to help.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Phone, title: "Call Us", desc: "1-800-DENTAL-HUB", detail: "Mon-Fri: 8AM - 8PM EST" },
                    { icon: Mail, title: "Email Us", desc: "support@dentypro.com", detail: "Response within 2 hours" },
                    {
                      icon: MessageSquare,
                      title: "Live Chat",
                      desc: "Chat with our support team",
                      detail: "Available 24/7",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start space-x-4 text-inverse-foreground">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-strong text-accent-foreground">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">{item.title}</div>
                        <div className="text-inverse-muted">{item.desc}</div>
                        <div className="text-sm text-inverse-muted/85">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="flex items-center rounded-full bg-accent-strong px-8 py-4 font-semibold text-accent-foreground transition-colors hover:brightness-105"
                >
                  Contact Support
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
              <div className="h-full min-h-[400px] relative">
                <Image
                  fill
                  className="object-cover"
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/7a1bbf49e4-c4f1c6e77acce9c8c7e2.png"
                  alt="Customer Support"
                />
              </div>
            </div>
          </div>
        </PageSectionContainer>
      </section>

      {/* FAQ Section */}
      <section className="bg-surface-muted/45 py-16">
        <PageSectionContainer as="div" containerClassName="max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-text-primary">Frequently Asked Questions</h2>
            <p className="text-lg text-text-secondary">Quick answers to common questions</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "How do I track my order?",
                a: "You can track your order by logging into your account and visiting the Orders section, or use the tracking link sent to your email.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, wire transfers, and offer net payment terms for verified practices.",
              },
              {
                q: "How do I become a verified vendor?",
                a: "Visit our Vendor Registration page and complete the verification process with required licenses and certifications.",
              },
              {
                q: "What is your return policy?",
                a: "We offer 30-day returns on most products. Items must be unused and in original packaging.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-[1.35rem] border border-border-soft bg-surface-elevated p-6 shadow-soft transition-shadow hover:shadow-panel"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-text-primary">{faq.q}</h3>
                    <p className="text-text-secondary">{faq.a}</p>
                  </div>
                  <ChevronDown className="ml-4 h-5 w-5 text-brand" />
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="flex items-center justify-center font-semibold text-brand hover:underline">
              View All FAQs <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </PageSectionContainer>
      </section>
    </div>
  )
}
