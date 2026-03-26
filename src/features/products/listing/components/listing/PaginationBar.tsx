import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface PaginationBarProps {
  currentPage: number
  pageSize: number
  totalElements: number
  totalPages: number
  buildUrl: (overrides: { page?: number; size?: number; view?: "grid" | "list" }) => string
}

const PaginationBar = ({ currentPage, pageSize, totalElements, totalPages, buildUrl }: PaginationBarProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <span className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-bold text-steel-blue">
          {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalElements)}
        </span>{" "}
        of <span className="font-bold text-steel-blue">{totalElements}</span>
      </span>
      <div className="flex items-center gap-2">
        {currentPage === 1 ? (
          <span className="p-2 border border-gray-200 rounded-lg text-gray-300 opacity-30">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </span>
        ) : (
          <Link
            href={buildUrl({ page: currentPage - 1 })}
            className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-steel-blue"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Link>
        )}

        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNumber = i + 1
          return (
            <Link
              key={pageNumber}
              href={buildUrl({ page: pageNumber })}
              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
                currentPage === pageNumber ? "bg-steel-blue text-white shadow-md" : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {pageNumber}
            </Link>
          )
        })}

        {currentPage >= totalPages ? (
          <span className="p-2 border border-gray-200 rounded-lg text-gray-300 opacity-30">
            <ChevronRight className="w-5 h-5" />
          </span>
        ) : (
          <Link
            href={buildUrl({ page: currentPage + 1 })}
            className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-steel-blue"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default PaginationBar
