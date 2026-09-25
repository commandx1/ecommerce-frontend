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
 * Guarantees `content` and every question's `answers` are arrays, so a malformed 200 can never
 * reach `.map`/`.find` downstream.
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

/** No caching: every mount (including a route revisit) re-fetches and shows the loading skeleton. */
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

/** A counts failure stays silent - the hook just leaves `counts` at its default. */
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
