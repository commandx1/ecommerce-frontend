"use client"

import { Bell, ExternalLink, FileWarning } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { extractFileName, type VendorDocument, vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { useAuthStore } from "@/stores/authStore"

const POLL_INTERVAL_MS = 60_000

export default function VendorNotificationBell() {
  const { accessToken } = useAuthStore()
  const [revisionDocs, setRevisionDocs] = useState<VendorDocument[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRevisionDocs = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await vendorDocumentsAPI.getDocuments({ page: 0, size: 50, sort: "desc" }, accessToken)
      setRevisionDocs(
        res.content.filter((d) => d.revisionRequested && !d.approved && !d.deleted && d.revisedFilePath === null),
      )
    } catch {
      // fail silently — bell is non-critical
    }
  }, [accessToken])

  useEffect(() => {
    void fetchRevisionDocs()
    intervalRef.current = setInterval(() => {
      void fetchRevisionDocs()
    }, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchRevisionDocs])

  const count = revisionDocs.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${count > 0 ? ` (${count} pending revision)` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface text-text-muted shadow-soft transition-colors hover:text-text-primary"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
          <span className="text-sm font-semibold text-text-primary">Notifications</span>
          {count > 0 && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
              {count} pending
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Bell className="h-8 w-8 text-text-muted" />
              <p className="text-sm font-medium text-text-secondary">No pending revisions</p>
              <p className="text-xs text-text-muted">You&apos;re all caught up!</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-soft">
              {revisionDocs.map((doc) => (
                <li key={doc.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 rounded-lg bg-warning/10 p-1.5">
                      <FileWarning className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium text-text-primary"
                        title={extractFileName(doc.filePath)}
                      >
                        {extractFileName(doc.filePath)}
                      </p>
                      {doc.requestedEdits && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{doc.requestedEdits}</p>
                      )}
                      <Link
                        href="/vendor-dashboard/products"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                      >
                        View in Products <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
