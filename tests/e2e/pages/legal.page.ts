import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Faz 8.2 - /legal (src/app/legal/page.tsx). Server Component, SSR'd from the
 * `?doc=` query param (`getSelectedDocument`, src/features/legal/getLegalDocuments.ts) -
 * the sidebar (LegalSidebar) links between documents are plain Next `<Link href="/legal?doc=...">`,
 * a real navigation, not a client fetch. No apiMock registration needed for
 * this page - the document content comes from src/data/legal-*.json.
 */
export class LegalPage extends BasePage {
  readonly path = "/legal"

  async gotoDoc(docId: string): Promise<void> {
    await this.goto({ doc: docId })
  }

  sidebarLink(title: string | RegExp): Locator {
    return this.page.getByRole("navigation").getByRole("link", { name: title })
  }

  get documentHeading(): Locator {
    // DocumentSection (src/features/legal/components/DocumentSection.tsx) is
    // the only `<section id="...">` on the page - ContactSupport / LegalArchive
    // / LegalHero sections render without an `id`. Scoping through it avoids
    // colliding with the page's other <h2>s ("Need Legal Assistance?",
    // "Document Archive").
    return this.page.locator("section[id]").getByRole("heading", { level: 2 })
  }
}
