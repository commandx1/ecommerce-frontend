import PageSectionContainer from "@/components/layout/PageSectionContainer"
import KnowledgeBaseCategoryCard from "@/features/help-center/components/KnowledgeBaseCategoryCard"
import KnowledgeBaseHeader from "@/features/help-center/components/knowledge-base/KnowledgeBaseHeader"
import { KNOWLEDGE_BASE_CATEGORIES } from "@/features/help-center/components/knowledge-base/knowledgeBaseCategories"

export default function KnowledgeBaseSection() {
  return (
    <PageSectionContainer as="section" className="py-16 bg-gray-50">
      <KnowledgeBaseHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {KNOWLEDGE_BASE_CATEGORIES.map((category) => (
          <KnowledgeBaseCategoryCard
            key={category.title}
            title={category.title}
            articles={category.articles}
            count={category.count}
            iconBg={category.iconBg}
            iconColor={category.iconColor}
            Icon={category.icon}
          />
        ))}
      </div>
    </PageSectionContainer>
  )
}
