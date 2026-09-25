import { formatMb } from "@/lib/helpers/format"

// Mirrors the server's default spring.servlet.multipart.max-file-size (1MB) — see
// `useDocumentUpload` for why this is checked client-side.
export const MAX_FILE_BYTES = 1024 * 1024

export type FileValidationResult = { ok: true } | { ok: false; title: string; message?: string }

/**
 * The two checks the old modal ran inline in its file-input `onChange`: the extension (the
 * accept attribute is only a hint, not enforcement) and the size (Spring Boot's default
 * `spring.servlet.multipart.max-file-size` is 1MB and this endpoint has no override — without
 * this check the request reaches the server, fails with `MaxUploadSizeExceededException`, and the
 * vendor sees that raw exception text in a toast instead of an understandable message).
 */
export function validateSelectedFile(file: File): FileValidationResult {
  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return { ok: false, title: "Please select an Excel file (.xlsx or .xls)" }
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      title: "File is too large",
      message: `${file.name} is ${formatMb(file.size)}. The server accepts up to ${formatMb(MAX_FILE_BYTES)}.`,
    }
  }

  return { ok: true }
}

// Backend message format: "<summary>\n\nDetails:\n- Row 2: ...\n- Row 3: ..."
export function parseImportMessage(message: string): { summary: string; rowIssues: string[] } {
  const [summary, detailsBlock] = message.split("\n\nDetails:\n")
  const rowIssues =
    detailsBlock
      ?.split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "")) ?? []
  return { summary: (summary ?? message).trim(), rowIssues }
}
