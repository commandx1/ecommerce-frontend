import type { ColumnDef } from "@tanstack/react-table"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { StatefulTableHarness } from "@/test/harness/stateful-table-harness"
import { render, screen, within } from "@/test/render"
import DataTable from "./data-table"

interface Row {
  id: string
  name: string
  total: number
}

const rows: Row[] = [
  { id: "r-1", name: "Acme Dental", total: 240 },
  { id: "r-2", name: "Beta Supplies", total: 90 },
]

const columns: Array<ColumnDef<Row, unknown>> = [
  { id: "name", header: "Supplier", accessorKey: "name" },
  { id: "total", header: "Total", accessorKey: "total", meta: { cellClassName: "total-cell" } },
]

describe("DataTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders a header row plus one row per record", () => {
    render(<DataTable columns={columns} data={rows} />)

    expect(screen.getAllByRole("row")).toHaveLength(3)
    expect(screen.getByRole("columnheader", { name: "Supplier" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "Beta Supplies" })).toBeInTheDocument()
  })

  it("shows the empty message instead of an empty body", () => {
    render(<DataTable columns={columns} data={[]} noRowsText="No orders found." />)

    expect(screen.getByRole("cell", { name: "No orders found." })).toBeInTheDocument()
  })

  it("hides the skeleton rows from assistive tech and announces the loading text", () => {
    render(<DataTable columns={columns} data={[]} isLoading loadingText="Loading orders..." />)

    expect(screen.getByText("Loading orders...")).toBeInTheDocument()
    expect(screen.queryByRole("cell", { name: "No rows found." })).not.toBeInTheDocument()
  })

  // Regression: the loading announcement used to be a body <tr>. It was not aria-hidden, so it
  // counted as a row — callers that wait for `getAllByRole("row").length > 1` to mean "data
  // arrived" resolved while the table was still loading, and DocumentProductsPanel hand-rolled
  // its own skeleton to avoid it. It is a <caption> now: still announced, no longer a row.
  it("exposes no data rows while loading, so row-count waits cannot resolve early", () => {
    render(<DataTable columns={columns} data={[]} isLoading loadingText="Loading orders..." />)

    // Header row only — the skeleton rows are aria-hidden and the announcement is not a row.
    expect(screen.getAllByRole("row")).toHaveLength(1)
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")
  })

  it("drops the loading announcement and the busy flag once data is in", () => {
    render(<DataTable columns={columns} data={rows} loadingText="Loading orders..." />)

    expect(screen.queryByText("Loading orders...")).not.toBeInTheDocument()
    expect(screen.getByRole("table")).not.toHaveAttribute("aria-busy")
  })

  it("reports a clicked row to its owner", async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={rows} getRowId={(row) => row.id} onRowClick={onRowClick} />)

    await user.click(screen.getByRole("cell", { name: "Acme Dental" }))

    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0]![0].id).toBe("r-1")
  })

  it("expands one row at a time and renders its detail content", async () => {
    const user = userEvent.setup()
    const expandableColumns: Array<ColumnDef<Row, unknown>> = [
      ...columns,
      {
        id: "expander",
        header: "",
        cell: ({ row }) => (
          <button type="button" onClick={row.getToggleExpandedHandler()}>
            {`Toggle ${row.original.name}`}
          </button>
        ),
      },
    ]

    render(
      <StatefulTableHarness>
        {({ expandedState, handleExpandedChange }) => (
          <DataTable
            columns={expandableColumns}
            data={rows}
            getRowId={(row) => row.id}
            expanded={expandedState}
            onExpandedChange={handleExpandedChange}
            renderExpandedContent={(row) => <p>{`Details for ${row.original.name}`}</p>}
          />
        )}
      </StatefulTableHarness>,
    )

    await user.click(screen.getByRole("button", { name: "Toggle Acme Dental" }))
    expect(await screen.findByText("Details for Acme Dental")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Toggle Beta Supplies" }))
    expect(await screen.findByText("Details for Beta Supplies")).toBeInTheDocument()
    expect(screen.queryByText("Details for Acme Dental")).not.toBeInTheDocument()
  })

  it("applies the per-row class the caller derives", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        getRowClassName={(row) => (row.original.total > 100 ? "is-large" : "")}
      />,
    )

    const [, firstRow, secondRow] = screen.getAllByRole("row")
    expect(firstRow).toHaveClass("is-large")
    expect(secondRow).not.toHaveClass("is-large")
  })

  it("passes a column's cell class through to every cell in it", () => {
    render(<DataTable columns={columns} data={rows} />)

    const bodyRow = screen.getAllByRole("row")[1]!
    expect(within(bodyRow).getByRole("cell", { name: "240" })).toHaveClass("total-cell")
  })

  // Deferred: column sorting is a dead control for now (product decision: "şimdilik
  // boşverelim"). When wired up, this verifies clicking a header sorts the rows and exposes
  // the sort state via aria-sort.
  it.todo("clicking a sortable column header sorts the rows and sets aria-sort")
})
