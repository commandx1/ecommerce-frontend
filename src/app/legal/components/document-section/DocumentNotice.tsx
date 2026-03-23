"use client"

import { noticeIconMap } from "./documentIcons"
import type { LegalNotice } from "../../types"

interface DocumentNoticeProps {
  notice: LegalNotice
}

const noticeColorMap: Record<LegalNotice["type"], string> = {
  warning: "bg-coral-orange/10 border-coral-orange text-coral-orange",
  success: "bg-green-50 border-green-500 text-green-500",
  info: "bg-blue-50 border-blue-500 text-blue-500",
  error: "bg-red-50 border-red-500 text-red-500",
}

const DocumentNotice = ({ notice }: DocumentNoticeProps) => {
  const NoticeIcon = noticeIconMap[notice.type]

  return (
    <div className={`${noticeColorMap[notice.type]} border-l-4 p-4 rounded-r-lg mb-6`}>
      <div className="flex items-start">
        {NoticeIcon && <NoticeIcon className="mr-3 mt-1 w-5 h-5 shrink-0" />}
        <div>
          <p className="font-semibold text-gray-800">{notice.title}</p>
          <p className="text-gray-700 text-sm">{notice.text}</p>
        </div>
      </div>
    </div>
  )
}

export default DocumentNotice
