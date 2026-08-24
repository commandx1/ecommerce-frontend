"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { useId, useState } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"
import type { FilterOption } from "@/lib/api/public-products"
import { useProductFiltersNavigation } from "../hooks/useProductFiltersNavigation"

interface CategoryNode {
  label: string
  fullPath: string
  count: number | null
  children: CategoryNode[]
}

function buildTree(categories: FilterOption[]): CategoryNode[] {
  const root: CategoryNode[] = []

  for (const cat of categories) {
    const segments = cat.name.split(">").map((s) => s.trim())
    let level = root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const isLeaf = i === segments.length - 1
      const fullPath = segments.slice(0, i + 1).join(" > ")

      let node = level.find((n) => n.label === segment)
      if (!node) {
        node = { label: segment, fullPath, count: null, children: [] }
        level.push(node)
      }
      if (isLeaf) node.count = cat.count

      level = node.children
    }
  }

  return root
}

interface TreeNodeProps {
  node: CategoryNode
  depth: number
  uid: string
  currentCategories: string[]
  toggle: (fullPath: string) => void
}

function TreeNode({ node, depth, uid, currentCategories, toggle }: TreeNodeProps) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div className="flex items-center gap-1 min-h-[28px]" style={{ paddingLeft: depth * 16 }}>
        {hasChildren ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((p) => !p)}
              className="flex items-center gap-1 text-left text-sm font-medium text-text-primary hover:text-brand transition-colors"
            >
              {open ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-text-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted" />
              )}
              <span className="select-none">{node.label}</span>
            </button>
            {node.count !== null && <span className="ml-auto shrink-0 text-xs text-text-muted">{node.count}</span>}
          </>
        ) : (
          <div className="flex items-center justify-between gap-2 w-full">
            <CheckboxField
              id={`${uid}-cat-${node.fullPath}`}
              label={node.label}
              checked={currentCategories.includes(node.fullPath)}
              onChange={() => toggle(node.fullPath)}
            />
            <span className="shrink-0 text-xs text-text-muted">{node.count}</span>
          </div>
        )}
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              uid={uid}
              currentCategories={currentCategories}
              toggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CategoryFilterProps {
  categories: FilterOption[]
}

const CategoryFilter = ({ categories }: CategoryFilterProps) => {
  const uid = useId()
  const { navigate, currentCategories } = useProductFiltersNavigation()

  if (categories.length === 0) return null

  const tree = buildTree(categories)

  const toggle = (fullPath: string) => {
    const next = currentCategories.includes(fullPath)
      ? currentCategories.filter((c) => c !== fullPath)
      : [...currentCategories, fullPath]
    navigate({ categories: next })
  }

  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Category</h3>
        {currentCategories.length > 0 && (
          <button
            type="button"
            onClick={() => navigate({ categories: [] })}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-1">
        {tree.map((node) => (
          <TreeNode
            key={node.fullPath}
            node={node}
            depth={0}
            uid={uid}
            currentCategories={currentCategories}
            toggle={toggle}
          />
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
