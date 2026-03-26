import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import SurfaceCard from "@/components/ui/SurfaceCard"

interface KnowledgeBaseCategoryCardProps {
  title: string
  articles: string[]
  count: number
  iconBg: string
  iconColor: string
  Icon: LucideIcon
}

const KnowledgeBaseCategoryCard = ({
  title,
  articles,
  count,
  iconBg,
  iconColor,
  Icon,
}: KnowledgeBaseCategoryCardProps) => {
  return (
    <SurfaceCard className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4`}>
          <Icon className={iconColor} />
        </div>
        <h3 className="text-xl font-semibold text-steel-blue">{title}</h3>
      </div>
      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article}>
            <Link href="#" className="text-gray-600 hover:text-steel-blue flex items-center">
              <ChevronRight className="w-3 h-3 mr-2" />
              {article}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="#" className="mt-4 text-steel-blue font-medium hover:underline inline-block">
        View all articles ({count}) →
      </Link>
    </SurfaceCard>
  )
}

export default KnowledgeBaseCategoryCard
