import { act, renderHook, waitFor } from "@testing-library/react"
import type { ChangeEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { queryKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useDocumentUpload } from "./useDocumentUpload"

const revalidateCategoryCountsSpy = vi.hoisted(() => vi.fn())
vi.mock("@/lib/actions/revalidate-category-counts", () => ({
  revalidateCategoryCounts: revalidateCategoryCountsSpy,
}))

// `uploadDocument`'s FormData body hangs when driven through a real MSW round trip in this test
// environment (see `vendor-documents.contract.test.ts`'s note on the same limitation), so this
// spies on the API function itself instead of the network layer.
const selectFile = (upload: ReturnType<typeof useDocumentUpload>, file: File) => {
  upload.handleFileChange({ target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>)
}

const makeXlsxFile = () => new File(["content"], "products.xlsx", { type: "application/vnd.ms-excel" })

const setup = () => {
  const { wrapper, client } = createQueryWrapper()
  return { ...renderHook(() => useDocumentUpload(() => {}), { wrapper }), client }
}

beforeEach(() => {
  revalidateCategoryCountsSpy.mockClear().mockResolvedValue(undefined)
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("useDocumentUpload", () => {
  it("revalidates category counts after an import that accepts at least one row", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      documentId: "doc-1",
      success: true,
      message: "ok",
      acceptedCount: 3,
      skippedCount: 0,
      wrongCount: 0,
      invalidRecordsFilePath: null,
    })
    const { result } = setup()
    act(() => selectFile(result.current, makeXlsxFile()))

    await act(() => result.current.handleUpload())

    await waitFor(() => expect(revalidateCategoryCountsSpy).toHaveBeenCalledTimes(1))
  })

  it("does not revalidate category counts when nothing was accepted", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      documentId: "doc-2",
      success: false,
      message: "all rows invalid",
      acceptedCount: 0,
      skippedCount: 1,
      wrongCount: 2,
      invalidRecordsFilePath: null,
    })
    const { result } = setup()
    act(() => selectFile(result.current, makeXlsxFile()))

    await act(() => result.current.handleUpload())

    await waitFor(() => expect(result.current.importResult).not.toBeNull())
    expect(revalidateCategoryCountsSpy).not.toHaveBeenCalled()
  })

  it("does not revalidate category counts when the upload request fails", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockRejectedValue(new Error("Failed to upload document"))
    const { result } = setup()
    act(() => selectFile(result.current, makeXlsxFile()))

    await act(() => result.current.handleUpload())

    await waitFor(() => expect(result.current.isUploading).toBe(false))
    expect(revalidateCategoryCountsSpy).not.toHaveBeenCalled()
  })

  /**
   * F4 regression guard: the import modal sits over VendorProductsPage. Before this fix, a
   * completed import only invalidated `vendor.documents.all`, so the products table, stat cards
   * and brand filter behind the modal kept showing pre-import data.
   */
  it("invalidates the vendor products list, stats and brands after an import accepts at least one row", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      documentId: "doc-3",
      success: true,
      message: "ok",
      acceptedCount: 2,
      skippedCount: 0,
      wrongCount: 0,
      invalidRecordsFilePath: null,
    })
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")
    act(() => selectFile(result.current, makeXlsxFile()))

    await act(() => result.current.handleUpload())

    await waitFor(() =>
      expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual(queryKeys.vendor.products.all),
    )
  })

  it("does not invalidate the vendor products list when nothing was accepted", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      documentId: "doc-4",
      success: false,
      message: "all rows invalid",
      acceptedCount: 0,
      skippedCount: 1,
      wrongCount: 2,
      invalidRecordsFilePath: null,
    })
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, "invalidateQueries")
    act(() => selectFile(result.current, makeXlsxFile()))

    await act(() => result.current.handleUpload())

    await waitFor(() => expect(result.current.importResult).not.toBeNull())
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).not.toContainEqual(
      queryKeys.vendor.products.all,
    )
  })
})
