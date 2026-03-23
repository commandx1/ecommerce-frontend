import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const HelpCenterSearchBar = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-2xl max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
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
    </div>
  )
}

export default HelpCenterSearchBar
