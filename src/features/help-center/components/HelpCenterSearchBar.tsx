import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const HelpCenterSearchBar = () => {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[1.35rem] border border-white/12 bg-white/10 p-6 shadow-panel backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            className="w-full border-white/14 bg-white/92 text-text-primary placeholder:text-text-muted"
          />
        </div>
        <button
          type="button"
          className="flex items-center rounded-full bg-accent-strong px-8 py-3 font-semibold text-accent-foreground transition-colors hover:brightness-105"
        >
          <Search className="mr-2 w-4 h-4" />
          Search
        </button>
      </div>
    </div>
  )
}

export default HelpCenterSearchBar
