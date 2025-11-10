import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import CategorySelect from "./CategorySelect"

const MainSearchbox = () => {
  return (
    <div className="flex w-full max-w-2xl mx-auto">
      <CategorySelect />
      <Input
        type="text"
        placeholder="Search products, brands, or suppliers..."
        className="rounded-none flex-1 w-full px-4 py-2.5 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
      />
      <button
        type="button"
        className="bg-steel-blue text-white px-5 rounded-r-lg hover:bg-opacity-90 flex items-center justify-center"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  )
}

export default MainSearchbox
