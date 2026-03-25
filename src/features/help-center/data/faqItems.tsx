import type { ReactNode } from "react"

export interface FaqItem {
  id: string
  question: string
  answer: ReactNode
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq1",
    question: "How do I verify my dental license?",
    answer: (
      <>
        <p className="mb-3">To verify your dental license and access professional pricing:</p>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>Log into your account and go to Account Settings</li>
          <li>Click on &quot;License Verification&quot; section</li>
          <li>Upload a clear photo of your current dental license</li>
          <li>Provide your NPI number and license number</li>
          <li>Our team will review and approve within 24-48 hours</li>
        </ol>
        <p className="mt-3">You&apos;ll receive an email confirmation once approved.</p>
      </>
    ),
  },
  {
    id: "faq2",
    question: "What are your shipping options and costs?",
    answer: (
      <>
        <p className="mb-3">We offer multiple shipping options to meet your needs:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Standard Shipping:</strong> 3-5 business days, FREE on orders over $199
          </li>
          <li>
            <strong>Express Shipping:</strong> 1-2 business days, $15.99
          </li>
          <li>
            <strong>Overnight Shipping:</strong> Next business day, $29.99
          </li>
          <li>
            <strong>Same-Day Delivery:</strong> Available in select metro areas, $49.99
          </li>
        </ul>
        <p className="mt-3">Shipping costs are calculated at checkout based on your location and order weight.</p>
      </>
    ),
  },
  {
    id: "faq3",
    question: "How do I return or exchange products?",
    answer: (
      <>
        <p className="mb-3">Our return policy is designed to be simple and fair:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Returns accepted within 30 days of delivery</li>
          <li>Products must be unopened and in original packaging</li>
          <li>Consumables and custom items are non-returnable</li>
          <li>Equipment returns may be subject to restocking fees</li>
        </ul>
        <p className="mt-3">
          To initiate a return, visit your Order History and click &quot;Return Item&quot; or contact our support team.
        </p>
      </>
    ),
  },
  {
    id: "faq4",
    question: "What payment methods do you accept?",
    answer: (
      <>
        <p className="mb-3">We accept various payment methods for your convenience:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Credit Cards: Visa, MasterCard, American Express, Discover</li>
          <li>Business Credit Cards and Corporate Cards</li>
          <li>Net 30 Terms (for qualified accounts)</li>
          <li>Purchase Orders (PO) for established customers</li>
          <li>Wire Transfers for large orders</li>
        </ul>
        <p className="mt-3">Net 30 terms require credit application and approval.</p>
      </>
    ),
  },
  {
    id: "faq5",
    question: "How do I track my order?",
    answer: (
      <>
        <p className="mb-3">Tracking your order is easy with multiple options:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Check your email for shipping confirmation with tracking number</li>
          <li>Log into your account and visit &quot;Order History&quot;</li>
          <li>Use our order tracking tool on the homepage</li>
          <li>Download our mobile app for real-time notifications</li>
        </ul>
        <p className="mt-3">
          You&apos;ll receive updates at each stage: processing, shipped, out for delivery, and delivered.
        </p>
      </>
    ),
  },
  {
    id: "faq6",
    question: "Do you offer volume discounts?",
    answer: (
      <>
        <p className="mb-3">Yes! We offer several ways to save on bulk orders:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Quantity Discounts:</strong> Automatic savings on eligible items
          </li>
          <li>
            <strong>Practice Packages:</strong> Bundled supplies at reduced rates
          </li>
          <li>
            <strong>Annual Contracts:</strong> Lock in lower prices for recurring orders
          </li>
          <li>
            <strong>Group Purchasing:</strong> Join with other practices for better rates
          </li>
        </ul>
        <p className="mt-3">Contact our sales team at 1-800-DENTAL-1 for custom pricing on large orders.</p>
      </>
    ),
  },
  {
    id: "faq7",
    question: "How do I set up automatic reordering?",
    answer: (
      <>
        <p className="mb-3">Automatic reordering saves time and ensures you never run out:</p>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>Go to your Order History and find the items you want to reorder</li>
          <li>Click &quot;Set up Auto-Reorder&quot; next to eligible products</li>
          <li>Choose your delivery frequency (weekly, monthly, quarterly)</li>
          <li>Set quantity and any special instructions</li>
          <li>Review and confirm your auto-reorder settings</li>
        </ol>
        <p className="mt-3">You can modify or cancel auto-reorders anytime in your account settings.</p>
      </>
    ),
  },
  {
    id: "faq8",
    question: "What if I receive damaged products?",
    answer: (
      <>
        <p className="mb-3">We take product quality seriously and will make it right:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Report damage within 48 hours of delivery</li>
          <li>Take photos of damaged items and packaging</li>
          <li>Contact us via chat, phone, or support ticket</li>
          <li>We&apos;ll arrange immediate replacement or refund</li>
          <li>No need to return damaged items in most cases</li>
        </ul>
        <p className="mt-3">For urgent replacements, we offer same-day shipping in select areas.</p>
      </>
    ),
  },
  {
    id: "faq9",
    question: "Do you provide product training?",
    answer: (
      <>
        <p className="mb-3">Yes! We offer comprehensive training and support:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Equipment Training:</strong> On-site installation and training
          </li>
          <li>
            <strong>Webinars:</strong> Monthly sessions on new products and techniques
          </li>
          <li>
            <strong>Video Tutorials:</strong> Step-by-step guides in your account
          </li>
          <li>
            <strong>CE Courses:</strong> Continuing education credits available
          </li>
          <li>
            <strong>Expert Consultations:</strong> One-on-one product guidance
          </li>
        </ul>
        <p className="mt-3">Most training is included with equipment purchases or available at no cost.</p>
      </>
    ),
  },
  {
    id: "faq10",
    question: "How do I become a supplier on DentalHub?",
    answer: (
      <>
        <p className="mb-3">Join our network of verified suppliers:</p>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>Complete our supplier application online</li>
          <li>Provide business license and tax documentation</li>
          <li>Submit product catalogs and certifications</li>
          <li>Pass our quality and compliance review</li>
          <li>Complete onboarding and training process</li>
        </ol>
        <p className="mt-3">Contact our partner team at partners@dentalhub.com to get started.</p>
      </>
    ),
  },
]
