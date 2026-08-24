import { describe, expect, it } from "vitest"
import legalDocumentsData from "@/data/legal-documents.json"
import { getDocumentsInOrder, getSelectedDocument } from "./getLegalDocuments"

describe("getDocumentsInOrder", () => {
  it("returns one document per sidebarNav entry, in sidebarNav order", () => {
    const documents = getDocumentsInOrder()
    expect(documents.map((d) => d.id)).toEqual(legalDocumentsData.sidebarNav.map((item) => item.id))
  })

  it("resolves every sidebarNav id to an actual document (none are dropped)", () => {
    const documents = getDocumentsInOrder()
    expect(documents).toHaveLength(legalDocumentsData.sidebarNav.length)
    for (const document of documents) {
      expect(document).toBeTruthy()
      expect(typeof document.title).toBe("string")
    }
  })

  it("includes documents sourced from the additional-documents dataset (e.g. vendor-agreement)", () => {
    const documents = getDocumentsInOrder()
    expect(documents.some((d) => d.id === "vendor-agreement")).toBe(true)
  })

  it("includes documents sourced from the primary documents dataset (e.g. terms-of-service)", () => {
    const documents = getDocumentsInOrder()
    expect(documents.some((d) => d.id === "terms-of-service")).toBe(true)
  })
})

describe("getSelectedDocument", () => {
  it("defaults to the first sidebarNav document when no docId is given", () => {
    const { selectedId, selectedDocument } = getSelectedDocument()
    expect(selectedId).toBe(legalDocumentsData.sidebarNav[0]?.id)
    expect(selectedDocument?.id).toBe(legalDocumentsData.sidebarNav[0]?.id)
  })

  it("selects the requested document when the docId is valid", () => {
    const { selectedId, selectedDocument } = getSelectedDocument("vendor-agreement")
    expect(selectedId).toBe("vendor-agreement")
    expect(selectedDocument?.id).toBe("vendor-agreement")
  })

  it("falls back to the default document when the docId does not match any known document", () => {
    const { selectedId } = getSelectedDocument("not-a-real-document")
    expect(selectedId).toBe(legalDocumentsData.sidebarNav[0]?.id)
  })

  it("falls back to the default document when docId is undefined", () => {
    const { selectedId } = getSelectedDocument(undefined)
    expect(selectedId).toBe(legalDocumentsData.sidebarNav[0]?.id)
  })

  it("falls back to the default document when docId is an empty string", () => {
    const { selectedId } = getSelectedDocument("")
    expect(selectedId).toBe(legalDocumentsData.sidebarNav[0]?.id)
  })
})
