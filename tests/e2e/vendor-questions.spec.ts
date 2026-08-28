import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { makeProductAnswer, makeProductQuestion, makeQuestionsPage } from "./mocks/vendor-questions.mocks"
import { VendorQuestionsPage } from "./pages/vendor-questions.page"

test.describe("vendor questions", () => {
  test("filter tabs send the `answered` param and swap the rendered list", async ({ vendorPage, apiMock }) => {
    const answeredQuestion = makeProductQuestion({
      id: "question-answered",
      question: "Is this autoclavable?",
      answers: [makeProductAnswer({ id: "answer-1", productQuestionId: "question-answered" })],
    })
    const unansweredQuestion = makeProductQuestion({
      id: "question-unanswered",
      question: "Does this ship internationally?",
      answers: [],
    })

    // Mirrors ProductQuestionController#getBySeller: `answered` is an optional
    // boolean query param - omitted entirely for "All".
    apiMock.on("GET", "/backend-api/product-questions/seller", ({ url }) => {
      const answered = url.searchParams.get("answered")
      if (answered === "true") return { body: makeQuestionsPage({ content: [answeredQuestion] }) }
      if (answered === "false") return { body: makeQuestionsPage({ content: [unansweredQuestion] }) }
      return { body: makeQuestionsPage({ content: [answeredQuestion, unansweredQuestion], totalElements: 2 }) }
    })
    registerAllMocks(apiMock)

    const questions = new VendorQuestionsPage(vendorPage)
    await questions.goto()

    await expect(vendorPage.getByText(answeredQuestion.question)).toBeVisible()
    await expect(vendorPage.getByText(unansweredQuestion.question)).toBeVisible()

    const answeredRequest = vendorPage.waitForRequest(
      (req) =>
        req.method() === "GET" &&
        req.url().includes("/backend-api/product-questions/seller") &&
        new URL(req.url()).searchParams.get("answered") === "true",
    )
    await questions.filterTab("Answered").click()
    await answeredRequest
    await expect(vendorPage.getByText(answeredQuestion.question)).toBeVisible()
    await expect(vendorPage.getByText(unansweredQuestion.question)).not.toBeVisible()

    const unansweredRequest = vendorPage.waitForRequest(
      (req) =>
        req.method() === "GET" &&
        req.url().includes("/backend-api/product-questions/seller") &&
        new URL(req.url()).searchParams.get("answered") === "false",
    )
    await questions.filterTab("Unanswered").click()
    await unansweredRequest
    await expect(vendorPage.getByText(unansweredQuestion.question)).toBeVisible()
    await expect(vendorPage.getByText(answeredQuestion.question)).not.toBeVisible()
  })

  test("writing an answer posts to /product-answers with the right body and updates the list", async ({
    vendorPage,
    apiMock,
  }) => {
    const question = makeProductQuestion({
      id: "question-1",
      question: "Is this autoclavable?",
      answers: [],
    })
    const answerText = "Yes, fully autoclavable up to 135°C."

    apiMock.on("GET", "/backend-api/product-questions/seller", () => ({
      body: makeQuestionsPage({ content: [question] }),
    }))
    apiMock.on("POST", "/backend-api/product-answers", () => ({
      body: makeProductAnswer({ id: "answer-new", productQuestionId: "question-1", answer: answerText }),
    }))
    registerAllMocks(apiMock)

    const questions = new VendorQuestionsPage(vendorPage)
    await questions.goto()

    await questions.writeAnswerButton(question.question).click()
    await questions.answerTextarea.fill(answerText)

    const createRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/backend-api/product-answers"),
    )
    await questions.submitAnswerButton.click()
    const request = await createRequest
    expect(request.postDataJSON()).toEqual({ productQuestionId: "question-1", answer: answerText })

    await expect(vendorPage.getByText(answerText)).toBeVisible()
  })

  test("vendor can edit and delete only their own answer among several answers on the same question (F46/F105)", async ({
    vendorPage,
    apiMock,
  }) => {
    const myAnswer = makeProductAnswer({
      id: "answer-mine",
      productQuestionId: "question-1",
      // Matches the default id the `vendorPage` fixture's auth cookie carries
      // (makeAccountUser() -> "user-1"), i.e. this IS the logged-in vendor.
      answererUserId: "user-1",
      answererName: "Serhat Belen",
      answer: "Yes, it ships worldwide.",
    })
    const otherAnswer = makeProductAnswer({
      id: "answer-other",
      productQuestionId: "question-1",
      answererUserId: "user-2",
      answererName: "Other Vendor",
      answer: "We also carry a matching kit for this.",
    })
    const question = makeProductQuestion({
      id: "question-1",
      question: "Does this ship worldwide?",
      answers: [myAnswer, otherAnswer],
    })
    const updatedText = "Yes, it ships worldwide via express courier."

    apiMock.on("GET", "/backend-api/product-questions/seller", () => ({
      body: makeQuestionsPage({ content: [question] }),
    }))
    // Registered up front (not mid-test): apiMock resolves to the FIRST
    // matching registered route, so an override added after registerAllMocks
    // would never win over the default handler already registered by it.
    apiMock.on("PUT", "/backend-api/product-answers/:answerId", ({ params }) => ({
      body: makeProductAnswer({ ...myAnswer, id: params.answerId, answer: updatedText }),
    }))
    registerAllMocks(apiMock)

    const questions = new VendorQuestionsPage(vendorPage)
    await questions.goto()

    await expect(vendorPage.getByText(myAnswer.answer)).toBeVisible()
    await expect(vendorPage.getByText(otherAnswer.answer)).toBeVisible()

    // Only the vendor's own answer offers edit/delete controls.
    await expect(questions.editAnswerButton(myAnswer.answer)).toBeVisible()
    await expect(questions.deleteAnswerButton(myAnswer.answer)).toBeVisible()
    await expect(questions.editAnswerButton(otherAnswer.answer)).toHaveCount(0)
    await expect(questions.deleteAnswerButton(otherAnswer.answer)).toHaveCount(0)

    // Edit own answer.
    await questions.editAnswerButton(myAnswer.answer).click()
    await questions.answerTextarea.fill(updatedText)
    const updateRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PUT" && req.url().includes("/backend-api/product-answers/answer-mine"),
    )
    await questions.saveChangesButton.click()
    const updateReq = await updateRequest
    expect(updateReq.postDataJSON()).toEqual({ answer: updatedText })
    await expect(vendorPage.getByText(updatedText)).toBeVisible()
    // The other vendor's answer is untouched by the edit.
    await expect(vendorPage.getByText(otherAnswer.answer)).toBeVisible()

    // Delete own (now-updated) answer.
    const deleteRequest = vendorPage.waitForRequest(
      (req) => req.method() === "DELETE" && req.url().includes("/backend-api/product-answers/answer-mine"),
    )
    await questions.deleteAnswerButton(updatedText).click()
    await expect(vendorPage.getByText("Are you sure you want to delete this answer?")).toBeVisible()
    await questions.confirmDeleteButton.click()
    await deleteRequest
    await expect(vendorPage.getByText(updatedText)).not.toBeVisible()
    await expect(vendorPage.getByText(otherAnswer.answer)).toBeVisible()
  })

  test("pagination requests and renders the next page", async ({ vendorPage, apiMock }) => {
    const pageOneQuestion = makeProductQuestion({ id: "question-page1", question: "Page one question?" })
    const pageTwoQuestion = makeProductQuestion({ id: "question-page2", question: "Page two question?" })

    apiMock.on("GET", "/backend-api/product-questions/seller", ({ url }) => {
      const page = url.searchParams.get("page") ?? "0"
      if (page === "1") {
        return { body: makeQuestionsPage({ content: [pageTwoQuestion], totalPages: 2, totalElements: 2, number: 1 }) }
      }
      return { body: makeQuestionsPage({ content: [pageOneQuestion], totalPages: 2, totalElements: 2, number: 0 }) }
    })
    registerAllMocks(apiMock)

    const questions = new VendorQuestionsPage(vendorPage)
    await questions.goto()
    await expect(vendorPage.getByText(pageOneQuestion.question)).toBeVisible()

    const nextPageRequest = vendorPage.waitForRequest(
      (req) =>
        req.method() === "GET" &&
        req.url().includes("/backend-api/product-questions/seller") &&
        new URL(req.url()).searchParams.get("page") === "1",
    )
    await questions.nextPageButton.click()
    await nextPageRequest
    await expect(vendorPage.getByText(pageTwoQuestion.question)).toBeVisible()
    await expect(vendorPage.getByText(pageOneQuestion.question)).not.toBeVisible()
  })
})
