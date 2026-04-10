import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import FAQItemCard from "@/features/help-center/components/FAQItemCard"
import { FAQ_ITEMS } from "@/features/help-center/data/faqItems"

export default function FAQSection() {
  return (
    <PageSectionContainer as="section" className="bg-surface-muted/45 py-16">
      <SectionHeading
        title="Frequently Asked Questions"
        description="Find quick answers to common questions about ordering, shipping, returns, and account management"
        className="mb-12 justify-center"
        titleClassName="text-4xl text-center mb-4"
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
      />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        {FAQ_ITEMS.map((item) => (
          <FAQItemCard key={item.id} item={item} />
        ))}
      </div>
    </PageSectionContainer>
  )
}
