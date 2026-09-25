import { describe, expect, it } from "vitest"
import { formatMb, MAX_FILE_BYTES, parseImportMessage, validateSelectedFile } from "./document-import"

function makeFile(name: string, size: number): File {
  const file = new File([new Uint8Array(size)], name)
  return file
}

describe("formatMb", () => {
  it("shows a whole number for an exact megabyte boundary", () => {
    expect(formatMb(1024 * 1024)).toBe("1MB")
  })

  it("shows one decimal for a non-exact size", () => {
    expect(formatMb(1.5 * 1024 * 1024)).toBe("1.5MB")
  })
})

describe("validateSelectedFile", () => {
  it("accepts a .xlsx file within the size limit", () => {
    expect(validateSelectedFile(makeFile("catalog.xlsx", 1024))).toEqual({ ok: true })
  })

  it("accepts a .xls file within the size limit", () => {
    expect(validateSelectedFile(makeFile("catalog.xls", 1024))).toEqual({ ok: true })
  })

  it("rejects a non-Excel extension", () => {
    const result = validateSelectedFile(makeFile("catalog.csv", 1024))
    expect(result).toEqual({ ok: false, title: "Please select an Excel file (.xlsx or .xls)" })
  })

  it("rejects a file over the server's 1MB limit", () => {
    const result = validateSelectedFile(makeFile("catalog.xlsx", MAX_FILE_BYTES + 1))
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({ title: "File is too large" })
    if (!result.ok) {
      expect(result.message).toContain("catalog.xlsx")
      expect(result.message).toContain("1MB")
    }
  })

  it("accepts a file exactly at the size limit", () => {
    expect(validateSelectedFile(makeFile("catalog.xlsx", MAX_FILE_BYTES))).toEqual({ ok: true })
  })
})

describe("parseImportMessage", () => {
  it("splits the summary from the details block", () => {
    const result = parseImportMessage("2 accepted, 1 failed.\n\nDetails:\n- Row 2: Missing price\n- Row 3: Invalid SKU")
    expect(result.summary).toBe("2 accepted, 1 failed.")
    expect(result.rowIssues).toEqual(["Row 2: Missing price", "Row 3: Invalid SKU"])
  })

  it("returns the whole message as the summary and no row issues when there is no details block", () => {
    const result = parseImportMessage("All 5 products imported successfully.")
    expect(result.summary).toBe("All 5 products imported successfully.")
    expect(result.rowIssues).toEqual([])
  })

  it("ignores non-bullet lines inside the details block", () => {
    const result = parseImportMessage("Import finished.\n\nDetails:\nSee below\n- Row 2: Bad barcode")
    expect(result.rowIssues).toEqual(["Row 2: Bad barcode"])
  })
})
