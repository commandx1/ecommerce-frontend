import FAQItemCard from "@/features/help-center/components/FAQItemCard"
import { FAQ_ITEMS } from "@/features/help-center/data/faqItems"

export default function FAQSection() {
  return (
    <section className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find quick answers to common questions about ordering, shipping, returns, and account management
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {FAQ_ITEMS.map((item) => (
            <FAQItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
