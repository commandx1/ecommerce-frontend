import SystemAnnouncementCard from "@/features/help-center/components/SystemAnnouncementCard"
import type { SystemAnnouncementItem } from "@/features/help-center/types"

interface SystemAnnouncementsPanelProps {
  announcements: SystemAnnouncementItem[]
}

export default function SystemAnnouncementsPanel({ announcements }: SystemAnnouncementsPanelProps) {
  return (
    <div className="rounded-2xl bg-light-mint-gray p-8">
      <h3 className="mb-6 text-2xl font-semibold text-steel-blue">Recent Updates & Announcements</h3>

      <div className="space-y-6">
        {announcements.map((announcement) => (
          <SystemAnnouncementCard
            key={announcement.title}
            type={announcement.type}
            dotColor={announcement.dotColor}
            date={announcement.date}
            title={announcement.title}
            description={announcement.description}
          />
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="w-full rounded-lg border border-steel-blue px-6 py-3 font-medium text-steel-blue transition-colors hover:bg-steel-blue hover:text-white"
        >
          View All Announcements
        </button>
      </div>
    </div>
  )
}
