import type { LegalDeviceClass } from "@/features/legal/types"

interface SectionDeviceClassesProps {
  deviceClasses: LegalDeviceClass[]
}

export default function SectionDeviceClassesBlock({ deviceClasses }: SectionDeviceClassesProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {deviceClasses.map((deviceClass) => (
        <div key={deviceClass.class} className="rounded-[1.35rem] border border-border-soft bg-surface-muted/70 p-6">
          <h4 className="mb-4 font-semibold text-text-primary">{deviceClass.class}</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            {deviceClass.items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
