import PageSectionContainer from "@/components/layout/PageSectionContainer"
import HelpCenterPopularTopics from "./HelpCenterPopularTopics"
import HelpCenterSearchBar from "./HelpCenterSearchBar"

export default function HelpCenterHero() {
  return (
    <section className="bg-linear-to-br from-steel-blue to-blue-800 h-[400px] flex items-center">
      <PageSectionContainer as="div" containerClassName="w-full">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Support & Help Center</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
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
