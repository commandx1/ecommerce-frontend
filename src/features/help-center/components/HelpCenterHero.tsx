import HelpCenterPopularTopics from "./HelpCenterPopularTopics"
import HelpCenterSearchBar from "./HelpCenterSearchBar"

export default function HelpCenterHero() {
  return (
    <section className="bg-linear-to-br from-steel-blue to-blue-800 h-[400px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Support & Help Center</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get the help you need, when you need it. Our comprehensive support center provides answers, assistance, and
            expert guidance for all your dental supply needs.
          </p>
          <HelpCenterSearchBar />
          <HelpCenterPopularTopics />
        </div>
      </div>
    </section>
  )
}
