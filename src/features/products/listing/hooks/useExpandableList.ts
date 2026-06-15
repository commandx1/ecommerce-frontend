import { useMemo, useState } from "react"

interface UseExpandableListOptions {
  initialVisible?: number
}

const DEFAULT_VISIBLE = 8

export const useExpandableList = <T>(items: T[], options: UseExpandableListOptions = {}) => {
  const { initialVisible = DEFAULT_VISIBLE } = options
  const [showAll, setShowAll] = useState(false)

  const visibleItems = useMemo(() => {
    return showAll ? items : items.slice(0, initialVisible)
  }, [items, initialVisible, showAll])

  const toggleShowAll = () => {
    setShowAll((prev) => !prev)
  }

  return {
    showAll,
    visibleItems,
    toggleShowAll,
  }
}
