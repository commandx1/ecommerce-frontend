import type { ProductAnswerResponse, SellerQuestionsPage } from "@/lib/api/vendor-questions"

/** A new answer goes first, matching the server's own newest-first ordering within a question. */
export function patchAnswerCreated(
  page: SellerQuestionsPage,
  questionId: string,
  answer: ProductAnswerResponse,
): SellerQuestionsPage {
  return {
    ...page,
    content: page.content.map((question) =>
      question.id === questionId ? { ...question, answers: [answer, ...question.answers] } : question,
    ),
  }
}

export function patchAnswerUpdated(
  page: SellerQuestionsPage,
  questionId: string,
  answer: ProductAnswerResponse,
): SellerQuestionsPage {
  return {
    ...page,
    content: page.content.map((question) =>
      question.id === questionId
        ? { ...question, answers: question.answers.map((a) => (a.id === answer.id ? answer : a)) }
        : question,
    ),
  }
}

export function patchAnswerDeleted(
  page: SellerQuestionsPage,
  questionId: string,
  answerId: string,
): SellerQuestionsPage {
  return {
    ...page,
    content: page.content.map((question) =>
      question.id === questionId
        ? { ...question, answers: question.answers.filter((a) => a.id !== answerId) }
        : question,
    ),
  }
}
