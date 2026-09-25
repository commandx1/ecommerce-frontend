import PageSectionContainer from "@/components/layout/PageSectionContainer"
import KnowledgeBaseCategoryCard from "@/features/help-center/components/KnowledgeBaseCategoryCard"
import { KNOWLEDGE_BASE_CATEGORIES } from "@/features/help-center/components/knowledge-base/knowledgeBaseCategories"

export default function KnowledgeBaseSection() {
  return (
    <PageSectionContainer as="section" className="bg-surface-muted/45 py-16">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-4xl font-bold text-text-primary">Knowledge Base</h2>
        <p className="mx-auto max-w-3xl text-xl text-text-secondary">
          Browse our extensive knowledge base organized by topic for quick self-service support
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
