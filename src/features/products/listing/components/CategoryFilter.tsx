"use client"

import { ChevronDown, ChevronRight, Search } from "lucide-react"
import { useEffect, useId, useMemo, useState } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { Input } from "@/components/ui/input"
import type { FilterOption } from "@/lib/api/public-products"
import { useProductFiltersNavigation } from "../hooks/useProductFiltersNavigation"
import {
  ancestorsOf,
  buildCategoryFacetTree,
  type CategoryFacetNode,
  collectBranchPaths,
  filterTreeByQuery,
  isSameOrDescendant,
} from "../lib/category-facet-tree"

function hasAnyBranch(tree: CategoryFacetNode[]): boolean {
  return tree.some((node) => node.children.length > 0 || hasAnyBranch(node.children))
}

interface TreeNodeProps {
  node: CategoryFacetNode
  depth: number
  uid: string
  currentCategories: string[]
  expandedPaths: Set<string>
  onToggleExpand: (fullPath: string) => void
  onToggleSelect: (fullPath: string) => void
}

function TreeNode({
  node,
  depth,
  uid,
  currentCategories,
  expandedPaths,
  onToggleExpand,
  onToggleSelect,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0
  const open = expandedPaths.has(node.fullPath)

  const isSelected = currentCategories.includes(node.fullPath)
  const hasSelectedAncestor = currentCategories.some(
    (sel) => sel !== node.fullPath && isSameOrDescendant(node.fullPath, sel),
  )

  return (
    <div>
      <div className="flex items-center gap-1 min-h-[28px]" style={{ paddingLeft: depth * 16 }}>
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${open ? "Collapse" : "Expand"} ${node.label}`}
            aria-expanded={open}
            onClick={() => onToggleExpand(node.fullPath)}
            className="flex w-3.5 shrink-0 items-center justify-center"
          >
            {open ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-text-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted" />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <div className="flex items-center justify-between gap-2 w-full">
          <CheckboxField
            id={`${uid}-cat-${node.fullPath}`}
            label={node.label}
            checked={isSelected || hasSelectedAncestor}
            disabled={hasSelectedAncestor}
            onChange={() => onToggleSelect(node.fullPath)}
          />
          <span className="ml-auto shrink-0 text-xs text-text-muted">{node.count}</span>
        </div>
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
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
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
  const [search, setSearch] = useState("")
  const { navigate, currentCategories } = useProductFiltersNavigation()

  const tree = useMemo(() => buildCategoryFacetTree(categories), [categories])

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const path of currentCategories) {
      initial.add(path)
      for (const ancestor of ancestorsOf(path)) {
        initial.add(ancestor)
      }
    }
    return initial
  })

  useEffect(() => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const path of currentCategories) {
        if (!next.has(path)) {
          next.add(path)
          changed = true
        }
        for (const ancestor of ancestorsOf(path)) {
          if (!next.has(ancestor)) {
            next.add(ancestor)
            changed = true
          }
        }
      }
      return changed ? next : prev
    })
  }, [currentCategories])

  if (categories.length === 0) return null
  if (tree.length === 0) return null

  const displayedTree = filterTreeByQuery(tree, search)
  const isSearching = search.trim().length > 0
  const effectiveExpandedPaths = isSearching ? new Set(collectBranchPaths(displayedTree)) : expandedPaths
  const showSearch = hasAnyBranch(tree) || tree.length > 8

  const toggleExpand = (fullPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(fullPath)) {
        next.delete(fullPath)
      } else {
        next.add(fullPath)
      }
      return next
    })
  }

  const toggleSelect = (fullPath: string) => {
    if (currentCategories.includes(fullPath)) {
      navigate({ categories: currentCategories.filter((c) => c !== fullPath) })
      return
    }

    const next = [...currentCategories.filter((c) => !isSameOrDescendant(c, fullPath)), fullPath]
    navigate({ categories: next })
  }

  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Category</h2>
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
      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <Input
            type="text"
            aria-label="Search categories"
            placeholder="Search categories..."
            className="w-full py-2 pr-4 pl-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-1 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {displayedTree.map((node) => (
          <TreeNode
            key={node.fullPath}
            node={node}
            depth={0}
            uid={uid}
            currentCategories={currentCategories}
            expandedPaths={effectiveExpandedPaths}
            onToggleExpand={toggleExpand}
            onToggleSelect={toggleSelect}
          />
        ))}
        {isSearching && displayedTree.length === 0 && (
          <p className="text-sm italic text-text-muted">No categories found</p>
        )}
      </div>
    </div>
  )
}

export default CategoryFilter
