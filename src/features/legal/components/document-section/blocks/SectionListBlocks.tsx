interface SectionListProps {
  items: string[]
}

export function SectionList({ items }: SectionListProps) {
  return (
    <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function SectionItems({ items }: SectionListProps) {
  return (
    <ul className="text-gray-700 mb-6 space-y-2">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  )
}

export function SectionWarningItems({ items }: SectionListProps) {
  const midpoint = Math.ceil(items.length / 2)

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <h4 className="font-semibold text-red-800 mb-3">You may not use our Service:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ul className="text-sm text-red-700 space-y-2">
          {items.slice(0, midpoint).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <ul className="text-sm text-red-700 space-y-2">
          {items.slice(midpoint).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
