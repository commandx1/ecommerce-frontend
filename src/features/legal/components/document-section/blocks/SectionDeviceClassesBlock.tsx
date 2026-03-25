import type { LegalDeviceClass } from "@/features/legal/types"

interface SectionDeviceClassesProps {
  deviceClasses: LegalDeviceClass[]
}

export default function SectionDeviceClassesBlock({ deviceClasses }: SectionDeviceClassesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {deviceClasses.map((deviceClass) => (
        <div key={deviceClass.class} className="bg-light-mint-gray p-6 rounded-xl">
          <h4 className="font-semibold text-steel-blue mb-4">{deviceClass.class}</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            {deviceClass.items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
