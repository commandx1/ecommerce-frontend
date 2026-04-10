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
    <SurfaceCard className="p-6 transition-shadow hover:shadow-soft">
      <div className="mb-4 flex items-center">
        <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={iconColor} />
        </div>
        <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      </div>
      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article}>
            <Link href="#" className="flex items-center text-text-secondary hover:text-brand">
              <ChevronRight className="w-3 h-3 mr-2" />
              {article}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="#" className="mt-4 inline-block font-medium text-brand hover:underline">
        View all articles ({count}) →
      </Link>
    </SurfaceCard>
  )
}

export default KnowledgeBaseCategoryCard
