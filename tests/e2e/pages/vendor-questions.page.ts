import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Vendor product questions page (`/vendor-dashboard/questions`). */
export class VendorQuestionsPage extends BasePage {
  readonly path = "/vendor-dashboard/questions"

  /**
   * `^` anchors the match to the start of the accessible name instead of
   * using `exact: true` - the tab's label is followed by an async count
   * badge ("Answered 3") once `/product-questions/seller/counts` resolves,
   * and an exact match would flake depending on whether that fetch has
   * landed yet. The anchor also keeps "Answered" from matching "Unanswered"
   * (a plain substring match would, since "Unanswered" contains "answered").
   */
  filterTab(label: "All" | "Answered" | "Unanswered"): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${label}\\b`) })
  }

  /** The card for one question, scoped by its question text. */
  questionCard(questionText: string): Locator {
    return this.page.locator("div.overflow-hidden.rounded-2xl.border").filter({ hasText: questionText })
  }

  writeAnswerButton(questionText: string): Locator {
    return this.questionCard(questionText).getByRole("button", { name: "Write an answer" })
  }

  get answerTextarea(): Locator {
    return this.page.getByPlaceholder("Type your answer here...")
  }

  get submitAnswerButton(): Locator {
    return this.page.getByRole("button", { name: "Submit answer" })
  }

  get saveChangesButton(): Locator {
    return this.page.getByRole("button", { name: "Save changes" })
  }

  /**
   * The block that renders one answer in "view" mode (not composing/editing),
   * scoped by its answer text - `space-y-2` is unique to that block on this
   * page (the composing/editing textareas use `space-y-3`).
   */
  answerBlock(answerText: string): Locator {
    return this.page.locator("div.space-y-2").filter({ hasText: answerText })
  }

  /**
   * Edit/delete are icon-only controls that render only for the vendor's own answer. They are
   * found by accessible name rather than by the lucide icon class: a name is what a screen-reader
   * user actually gets, so locating by it means these tests fail if the name is ever dropped.
   * (They had none until 28 Aug 2026 - same class of gap as F91/F112.)
   */
  editAnswerButton(answerText: string): Locator {
    return this.answerBlock(answerText).getByRole("button", { name: "Edit your answer" })
  }

  deleteAnswerButton(answerText: string): Locator {
    return this.answerBlock(answerText).getByRole("button", { name: "Delete your answer" })
  }

  get confirmDeleteButton(): Locator {
    return this.page.getByRole("button", { name: "Delete", exact: true })
  }

  get nextPageButton(): Locator {
    return this.page.getByLabel("Go to next page")
  }

  get previousPageButton(): Locator {
    return this.page.getByLabel("Go to previous page")
  }
}
