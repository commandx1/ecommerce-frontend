import type { ExpandedState, OnChangeFn } from "@tanstack/react-table"
import { type ReactElement, useState } from "react"

export interface StatefulTableState {
  /** Current TanStack Table expanded state — feed this into the table's `expanded` prop. */
  expandedState: ExpandedState
  /** Wire this into the table's `onExpandedChange` so the harness owns the state. */
  handleExpandedChange: OnChangeFn<ExpandedState>
}

/**
 * Mirrors the "only one row open at a time" expansion rule the dashboard tables implement in
 * their page hooks: the most recently expanded row wins, and `expanded: true` (TanStack's
 * expand-all signal) collapses everything instead.
 */
export function useSingleExpandTableState(): StatefulTableState {
  const [expandedState, setExpandedState] = useState<ExpandedState>({})

  const handleExpandedChange: OnChangeFn<ExpandedState> = (nextExpanded) => {
    const resolved = typeof nextExpanded === "function" ? nextExpanded(expandedState) : nextExpanded

    if (resolved === true) {
      setExpandedState({})
      return
    }

    const resolvedMap = resolved as Record<string, boolean>
    const expandedRowIds = Object.keys(resolvedMap).filter((rowId) => Boolean(resolvedMap[rowId]))
    const lastExpandedRowId = expandedRowIds[expandedRowIds.length - 1]
    setExpandedState(lastExpandedRowId ? { [lastExpandedRowId]: true } : {})
  }

  return { expandedState, handleExpandedChange }
}

export interface StatefulTableHarnessProps {
  children: (state: StatefulTableState) => ReactElement | null
}

/**
 * Test-only wrapper that gives a dashboard table real, stateful expansion.
 *
 * Table components read their expanded state from a context/store that tests normally stub with a
 * static value, which makes expand/collapse a no-op. Rendering the table inside this harness lets a
 * test click an expander and assert on what the expanded content actually renders.
 *
 * The render prop is intentionally table-agnostic — pass the state into whichever mocked selector
 * the table under test reads from.
 *
 * ```tsx
 * render(
 *   <StatefulTableHarness>
 *     {({ expandedState, handleExpandedChange }) => {
 *       configureTableMocks({ expandedState }, { handleExpandedChange })
 *       return <OrdersTable />
 *     }}
 *   </StatefulTableHarness>,
 * )
 * ```
 */
export function StatefulTableHarness({ children }: StatefulTableHarnessProps): ReactElement | null {
  return children(useSingleExpandTableState())
}
