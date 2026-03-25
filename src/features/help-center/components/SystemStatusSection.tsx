import SystemAnnouncementsPanel from "@/features/help-center/components/system-status/SystemAnnouncementsPanel"
import SystemStatusPanel from "@/features/help-center/components/system-status/SystemStatusPanel"
import {
  SYSTEM_ANNOUNCEMENTS,
  SYSTEM_STATUS_ITEMS,
} from "@/features/help-center/components/system-status/systemStatusData"

export default function SystemStatusSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">System Status & Updates</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed about platform performance, scheduled maintenance, and new feature releases
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SystemStatusPanel items={SYSTEM_STATUS_ITEMS} />
          <SystemAnnouncementsPanel announcements={SYSTEM_ANNOUNCEMENTS} />
        </div>
      </div>
    </section>
  )
}
