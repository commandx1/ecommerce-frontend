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

export interface CreateAnswerPayload {
  productQuestionId: string
  answer: string
}

export interface UpdateAnswerPayload {
  answer: string
}

class VendorQuestionsAPI {
  async getSellerQuestions(page = 0, size = 10): Promise<SellerQuestionsPage> {
    const response = await apiClient.get<SellerQuestionsPage>("/product-questions/seller", {
      params: { page, size },
    })
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
