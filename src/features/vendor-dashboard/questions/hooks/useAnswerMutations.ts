"use client"

import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { showToast } from "@/components/ui/Toast"
import {
  type CreateAnswerPayload,
  type ProductAnswerResponse,
  type SellerQuestionsPage,
  vendorQuestionsAPI,
} from "@/lib/api/vendor-questions"
import { queryKeys } from "@/lib/query/keys"
import type { QuestionsListParams } from "../api/questions-queries"
import { patchAnswerCreated, patchAnswerDeleted, patchAnswerUpdated } from "../lib/question-patches"

interface UpdateAnswerVariables {
  answerId: string
  answer: string
}

interface DeleteAnswerVariables {
  questionId: string
  answerId: string
}

export interface AnswerMutations {
  createAnswer: UseMutationResult<ProductAnswerResponse, unknown, CreateAnswerPayload>
  updateAnswer: UseMutationResult<ProductAnswerResponse, unknown, UpdateAnswerVariables>
  deleteAnswer: UseMutationResult<void, unknown, DeleteAnswerVariables>
}

/**
 * Cache patches match today's page-local `setQuestions` updates exactly (design §3.3): create
 * and delete both patch the active list and invalidate the counts query once; update only
 * patches the list - the page never refetched counts after an edit, only after a create/delete
 * changed the unanswered total.
 */
export function useAnswerMutations(listParams: QuestionsListParams): AnswerMutations {
  const queryClient = useQueryClient()
  const listKey = queryKeys.vendor.questions.list(listParams)

  const createAnswer = useMutation({
    mutationFn: (payload: CreateAnswerPayload) => vendorQuestionsAPI.createAnswer(payload),
    onSuccess: (answer) => {
      queryClient.setQueryData<SellerQuestionsPage>(listKey, (page) =>
        page ? patchAnswerCreated(page, answer.productQuestionId, answer) : page,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.vendor.questions.counts() })
    },
    onError: () => showToast.error("Failed to save answer", "Please try again."),
  })

  const updateAnswer = useMutation({
    mutationFn: ({ answerId, answer }: UpdateAnswerVariables) => vendorQuestionsAPI.updateAnswer(answerId, { answer }),
    onSuccess: (answer) => {
      queryClient.setQueryData<SellerQuestionsPage>(listKey, (page) =>
        page ? patchAnswerUpdated(page, answer.productQuestionId, answer) : page,
      )
    },
    onError: () => showToast.error("Failed to save answer", "Please try again."),
  })

  const deleteAnswer = useMutation({
    mutationFn: async ({ answerId }: DeleteAnswerVariables) => {
      await vendorQuestionsAPI.deleteAnswer(answerId)
    },
    onSuccess: (_data, { questionId, answerId }) => {
      queryClient.setQueryData<SellerQuestionsPage>(listKey, (page) =>
        page ? patchAnswerDeleted(page, questionId, answerId) : page,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.vendor.questions.counts() })
    },
    onError: () => showToast.error("Failed to delete answer", "Please try again."),
  })

  return { createAnswer, updateAnswer, deleteAnswer }
}
