import PageSectionContainer from "@/components/layout/PageSectionContainer"
import HelpCenterPopularTopics from "./HelpCenterPopularTopics"
import HelpCenterSearchBar from "./HelpCenterSearchBar"

export default function HelpCenterHero() {
  return (
    <section className="bg-brand text-inverse-foreground dark:bg-brand-surface">
      <PageSectionContainer as="div" className="flex min-h-[400px] items-center py-16" containerClassName="w-full">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center text-inverse-foreground">
          <h1 className="mb-6 text-5xl font-bold text-inverse-muted">Support & Help Center</h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-inverse-muted">
            Get the help you need, when you need it. Our comprehensive support center provides answers, assistance, and
            expert guidance for all your dental supply needs.
          </p>
          <HelpCenterSearchBar />
          <HelpCenterPopularTopics />
        </div>
      </PageSectionContainer>
    </section>
  )
}
