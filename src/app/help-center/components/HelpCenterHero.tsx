import { Search } from "lucide-react"

export default function HelpCenterHero() {
  return (
    <section
      id="support-hero"
      className="bg-linear-to-br from-steel-blue to-blue-800 h-[400px] flex items-center"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Support & Help Center</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get the help you need, when you need it. Our comprehensive support
            center provides answers, assistance, and expert guidance for all
            your dental supply needs.
          </p>
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-2xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search for help articles, FAQs, or topics..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
                />
              </div>
              <button
                type="button"
                className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold flex items-center"
              >
                <Search className="mr-2 w-4 h-4" />
                Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-gray-600">Popular topics:</span>
              <button
                type="button"
                className="text-sm text-steel-blue hover:underline"
              >
                Order Status
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                className="text-sm text-steel-blue hover:underline"
              >
                Returns
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                className="text-sm text-steel-blue hover:underline"
              >
                Account Setup
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                className="text-sm text-steel-blue hover:underline"
              >
                Billing
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
