import { Download, FileText } from "lucide-react"
import type { LegalReport } from "@/features/legal/types"

interface SectionReportsProps {
  reports: LegalReport[]
}

export default function SectionReportsBlock({ reports }: SectionReportsProps) {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.title} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center">
                <FileText className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-steel-blue mb-1">{report.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                className="bg-light-mint-gray text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-80 text-sm font-medium"
              >
                View
              </button>
              <button
                type="button"
                className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm font-medium"
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
