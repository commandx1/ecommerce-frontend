import { queryOptions } from "@tanstack/react-query"
import {
  type ProductQuestionResponse,
  type QuestionFilter,
  type SellerQuestionCounts,
  type SellerQuestionsPage,
  vendorQuestionsAPI,
} from "@/lib/api/vendor-questions"
import { queryKeys } from "@/lib/query/keys"

export interface QuestionsListParams {
  page: number
  size: number
  filter: QuestionFilter
}

/**
 * Guarantees `content` is an array and every question's `answers` is an array, so a malformed
 * 200 (missing/null/non-array `content`, or a question with a missing/non-array `answers`) can
 * never reach `.map`/`.find` downstream - the same normalization the page did inline before
 * this query existed (F77/F83-class bug).
 */
function normalizeQuestionsPage(page: SellerQuestionsPage): SellerQuestionsPage {
  const content: ProductQuestionResponse[] = Array.isArray(page?.content) ? page.content : []
  return {
    ...page,
    content: content.map((question) => ({
      ...question,
      answers: Array.isArray(question.answers) ? question.answers : [],
    })),
    totalPages: Number.isFinite(page?.totalPages) ? page.totalPages : 0,
    totalElements: Number.isFinite(page?.totalElements) ? page.totalElements : 0,
  }
}

/** D1 (lead decision): `staleTime: 0, gcTime: 0` - every mount (including a route revisit)
 * re-fetches and shows the loading skeleton, exactly like the old per-page-change effect did. */
export function vendorQuestionsListOptions(params: QuestionsListParams, enabled: boolean) {
  return queryOptions<SellerQuestionsPage>({
    queryKey: queryKeys.vendor.questions.list(params),
    queryFn: () =>
      vendorQuestionsAPI.getSellerQuestions(params.page, params.size, params.filter).then(normalizeQuestionsPage),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

/** Counts failure stays silent (design §3.2) - the hook just leaves `counts` at its default. */
export function vendorQuestionsCountsOptions(enabled: boolean) {
  return queryOptions<SellerQuestionCounts>({
    queryKey: queryKeys.vendor.questions.counts(),
    queryFn: () => vendorQuestionsAPI.getSellerCounts(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
