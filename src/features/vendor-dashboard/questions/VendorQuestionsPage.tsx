"use client"

import { MessageSquare } from "lucide-react"
import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Skeleton } from "@/components/ui/skeleton"
import QuestionCard from "./components/QuestionCard"
import QuestionFilterTabs from "./components/QuestionFilterTabs"
import { useAnswerMutations } from "./hooks/useAnswerMutations"
import { QUESTIONS_PAGE_SIZE, useVendorQuestionsPage } from "./hooks/useVendorQuestionsPage"

const SKELETON_CARD_IDS = ["card-1", "card-2", "card-3", "card-4"] as const

export default function VendorQuestionsPage() {
  const {
    isAuthenticated,
    currentUserId,
    questions,
    counts,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    activeFilter,
    handleFilterChange,
  } = useVendorQuestionsPage()

  const mutations = useAnswerMutations({ page: currentPage, size: QUESTIONS_PAGE_SIZE, filter: activeFilter })

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">Please log in to view questions.</p>
      </div>
    )
  }

  return (
    <>
      <section className="mb-8">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Product Questions"
          description="Answer customer questions about your products"
          actions={
            // Reserved while the counts load: on mobile the badge appearing late pushed the panel
            // down ~62px (the route's whole 0.176 CLS). Collapsing it for zero unanswered is the trade.
            isLoading ? (
              <Skeleton className="h-11 w-40 rounded-2xl" />
            ) : counts && counts.unanswered > 0 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-2.5">
                <MessageSquare className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold text-warning-strong">{counts.unanswered} unanswered</span>
              </div>
            ) : undefined
          }
        />
      </section>

      <SurfaceCard as="section" variant="glass" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border-soft px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <QuestionFilterTabs activeFilter={activeFilter} counts={counts} onFilterChange={handleFilterChange} />
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {SKELETON_CARD_IDS.map((id) => (
                <div key={id} className="overflow-hidden rounded-2xl border border-border-soft">
                  <Skeleton className="h-11 rounded-none" />
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-px rounded-none" />
                    <Skeleton className="h-9 w-36 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted">
                <MessageSquare className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-base font-semibold text-text-primary">
                {activeFilter === "unanswered"
                  ? "No unanswered questions"
                  : activeFilter === "answered"
                    ? "No answered questions yet"
                    : "No questions yet"}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {activeFilter === "all"
                  ? "Customer questions about your products will appear here."
                  : "Switch to a different filter to see other questions."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  currentUserId={currentUserId}
                  mutations={mutations}
                />
              ))}
            </div>
          )}
        </div>

        {/* The pagination row is reserved while loading so it does not pop in and shift the page.
            Mirrors DashboardPagination's own border-t + p-4. */}
        {isLoading ? (
          <div
            aria-hidden="true"
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft p-4"
          >
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
        ) : totalPages > 0 ? (
          <DashboardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={QUESTIONS_PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </SurfaceCard>
    </>
  )
}
