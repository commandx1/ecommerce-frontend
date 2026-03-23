import { useCallback } from "react"

import { showToast } from "@/components/ui/Toast"

export const useDocumentActions = () => {
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownload = useCallback(() => {
    showToast.info("Download requested", "PDF downloads will be available soon.")
  }, [])

  return {
    handleDownload,
    handlePrint,
  }
}
