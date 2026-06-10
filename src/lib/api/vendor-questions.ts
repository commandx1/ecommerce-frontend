import apiClient from "./client"

export interface ProductAnswerResponse {
  id: string
  productQuestionId: string
  answererUserId: string
  answererName: string
  answer: string
  createdDate: string | null
}

export interface ProductQuestionResponse {
  id: string
  productId: string
  productName: string | null
  userId: string
  questionerName: string
  userProductId: string
  sellerName: string
  question: string
  createdDate: string | null
  answers: ProductAnswerResponse[]
}

export interface SellerQuestionsPage {
  content: ProductQuestionResponse[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export interface SellerQuestionCounts {
  total: number
  answered: number
  unanswered: number
}

export type QuestionFilter = "all" | "answered" | "unanswered"

export interface CreateAnswerPayload {
  productQuestionId: string
  answer: string
}

export interface UpdateAnswerPayload {
  answer: string
}

class VendorQuestionsAPI {
  async getSellerQuestions(page = 0, size = 10, filter: QuestionFilter = "all"): Promise<SellerQuestionsPage> {
    const answered = filter === "answered" ? true : filter === "unanswered" ? false : undefined
    const response = await apiClient.get<SellerQuestionsPage>("/product-questions/seller", {
      params: { page, size, ...(answered !== undefined && { answered }) },
    })
    return response.data
  }

  async getSellerCounts(): Promise<SellerQuestionCounts> {
    const response = await apiClient.get<SellerQuestionCounts>("/product-questions/seller/counts")
    return response.data
  }

  async createAnswer(payload: CreateAnswerPayload): Promise<ProductAnswerResponse> {
    const response = await apiClient.post<ProductAnswerResponse>("/product-answers", payload)
    return response.data
  }

  async updateAnswer(answerId: string, payload: UpdateAnswerPayload): Promise<ProductAnswerResponse> {
    const response = await apiClient.put<ProductAnswerResponse>(`/product-answers/${answerId}`, payload)
    return response.data
  }

  async deleteAnswer(answerId: string): Promise<void> {
    await apiClient.delete(`/product-answers/${answerId}`)
  }
}

export const vendorQuestionsAPI = new VendorQuestionsAPI()
