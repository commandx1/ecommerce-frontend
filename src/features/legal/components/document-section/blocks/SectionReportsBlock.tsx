import { Download, FileText } from "lucide-react"
import type { LegalReport } from "@/features/legal/types"

interface SectionReportsProps {
  reports: LegalReport[]
}

export default function SectionReportsBlock({ reports }: SectionReportsProps) {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.title}
          className="rounded-2xl border border-border-soft bg-surface-elevated p-6 transition-shadow hover:shadow-soft"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-primary-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="mb-1 font-semibold text-text-primary">{report.title}</h4>
                <p className="mb-2 text-sm text-text-secondary">{report.description}</p>
                <div className="flex items-center space-x-4 text-xs text-text-muted">
                  <span>Report Period: {report.period}</span>
                  <span>•</span>
                  <span>Auditor: {report.auditor}</span>
                  <span>•</span>
                  <span>Status: {report.status}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                className="rounded-full bg-surface-muted px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-accent"
              >
                View
              </button>
              <button
                type="button"
                className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
