import NoticeBanner from "@/components/feedback/NoticeBanner"
import type { LegalNotice } from "@/features/legal/types"
import { noticeIconMap } from "./documentIcons"

interface DocumentNoticeProps {
  notice: LegalNotice
}

const toneMap: Record<LegalNotice["type"], "warning" | "success" | "info" | "error"> = {
  warning: "warning",
  success: "success",
  info: "info",
  error: "error",
}

const DocumentNotice = ({ notice }: DocumentNoticeProps) => {
  const NoticeIcon = noticeIconMap[notice.type]

  return (
    <NoticeBanner
      tone={toneMap[notice.type]}
      title={notice.title}
      description={notice.text}
      icon={NoticeIcon ? <NoticeIcon className="mt-0.5 h-5 w-5 shrink-0" /> : undefined}
      className="mb-6 rounded-r-lg border-l-4"
    />
  )
}

export default DocumentNotice
