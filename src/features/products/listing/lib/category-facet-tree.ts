import type { FilterOption } from "@/lib/api/public-products"
import { getChildren } from "@/lib/category-tree"
import { CATEGORY_PATH_SEPARATOR } from "./category-path-separator"

export { CATEGORY_PATH_SEPARATOR }

export interface CategoryFacetNode {
  label: string
  fullPath: string
  count: number
  children: CategoryFacetNode[]
}

interface MutableFacetNode {
  label: string
  segments: string[]
  ownCount: number
  count: number
  children: MutableFacetNode[]
}

/** Split a backend/URL path string into trimmed non-empty segments. */
export function splitCategoryPath(fullPath: string): string[] {
  return fullPath
    .split(">")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
}

/** All strict ancestor paths of fullPath, shortest first: "A > B > C" -> ["A", "A > B"]. */
export function ancestorsOf(fullPath: string): string[] {
  const segments = splitCategoryPath(fullPath)
  const ancestors: string[] = []

  for (let i = 1; i < segments.length; i++) {
    ancestors.push(segments.slice(0, i).join(CATEGORY_PATH_SEPARATOR))
  }

  return ancestors
}

/** True when `candidate` equals `ancestor` or is a descendant path of it (segment-wise, not string-prefix). */
export function isSameOrDescendant(candidate: string, ancestor: string): boolean {
  const candidateSegments = splitCategoryPath(candidate)
  const ancestorSegments = splitCategoryPath(ancestor)

  if (ancestorSegments.length > candidateSegments.length) {
    return false
  }

  return ancestorSegments.every((segment, index) => segment === candidateSegments[index])
}

function buildTaxonomyMirror(pathSegments: string[]): MutableFacetNode[] {
  return getChildren(pathSegments).map((node) => {
    const segments = [...pathSegments, node.name]
    return {
      label: node.name,
      segments,
      ownCount: 0,
      count: 0,
      children: buildTaxonomyMirror(segments),
    }
  })
}

function insertOption(roots: MutableFacetNode[], segments: string[], count: number): void {
  let levelNodes = roots

  for (const [i, label] of segments.entries()) {
    let node = levelNodes.find((candidate) => candidate.label === label)

    if (!node) {
      node = {
        label,
        segments: segments.slice(0, i + 1),
        ownCount: 0,
        count: 0,
        children: [],
      }
      levelNodes.push(node)
    }

    if (i === segments.length - 1) {
      node.ownCount += count
    }

    levelNodes = node.children
  }
}

function rollup(nodes: MutableFacetNode[]): void {
  for (const node of nodes) {
    rollup(node.children)
    const childrenSum = node.children.reduce((sum, child) => sum + child.count, 0)
    node.count = node.ownCount + childrenSum
  }
}

function toFacetNodes(nodes: MutableFacetNode[]): CategoryFacetNode[] {
  const result: CategoryFacetNode[] = []

  for (const node of nodes) {
    if (node.count <= 0) {
      continue
    }

    result.push({
      label: node.label,
      fullPath: node.segments.join(CATEGORY_PATH_SEPARATOR),
      count: node.count,
      children: toFacetNodes(node.children),
    })
  }

  return result
}

/**
 * Build the pruned facet tree.
 * - Walk the taxonomy from getChildren([]) recursively (JSON order). Only keep a node if it or any descendant
 *   has a count from `options`. Node count = own count (exact path match) + descendants' counts.
 * - Options whose path is NOT in the taxonomy are still included: attach them under their real parent chain
 *   (creating intermediate nodes as needed) AFTER the taxonomy siblings at that level, in the order they
 *   appear in `options`. Their parents' counts roll up the same way.
 * - Options with an empty path (after split) are ignored. Duplicate paths: counts are summed.
 */
export function buildCategoryFacetTree(options: FilterOption[]): CategoryFacetNode[] {
  const roots = buildTaxonomyMirror([])

  for (const option of options) {
    const segments = splitCategoryPath(option.name)
    if (segments.length === 0) {
      continue
    }

    insertOption(roots, segments, option.count)
  }

  rollup(roots)

  return toFacetNodes(roots)
}

/**
 * Case-insensitive substring filter on `label` at any depth. Returns a new tree containing only nodes that
 * match or have a matching descendant (matching node keeps ALL its children). Empty/whitespace query
 * returns the input tree unchanged (same reference is fine).
 */
export function filterTreeByQuery(tree: CategoryFacetNode[], query: string): CategoryFacetNode[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) {
    return tree
  }

  const lowerQuery = trimmed.toLowerCase()

  function filterNodes(nodes: CategoryFacetNode[]): CategoryFacetNode[] {
    const result: CategoryFacetNode[] = []

    for (const node of nodes) {
      if (node.label.toLowerCase().includes(lowerQuery)) {
        result.push(node)
        continue
      }

      const filteredChildren = filterNodes(node.children)
      if (filteredChildren.length > 0) {
        result.push({ ...node, children: filteredChildren })
      }
    }

    return result
  }

  return filterNodes(tree)
}

function findFacetNode(nodes: CategoryFacetNode[], fullPath: string): CategoryFacetNode | undefined {
  for (const node of nodes) {
    if (node.fullPath === fullPath) {
      return node
    }
    if (isSameOrDescendant(fullPath, node.fullPath)) {
      const found = findFacetNode(node.children, fullPath)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

/**
 * Toggle `fullPath` in/out of `selected`, given the backend's "path is a prefix match" semantics:
 * - Already selected -> remove it.
 * - Implicitly selected (a selected ancestor covers it) -> "exclude" it: drop the ancestor and re-add every
 *   sibling branch from the ancestor down to the target's parent, skipping the branch that leads to the target.
 *   ponytail: this expands every intermediate category on the path into its children, so a product assigned
 *   directly to one of those intermediate categories (not to a leaf) is dropped from the selection. QA data
 *   only has products on leaf paths today; revisit if that changes.
 * - Otherwise -> select it, drop any selected descendants, then merge up: whenever every child of a tree
 *   node ends up selected, replace them with the parent, repeating toward the root.
 */
export function toggleCategorySelection(tree: CategoryFacetNode[], selected: string[], fullPath: string): string[] {
  if (selected.includes(fullPath)) {
    return selected.filter((path) => path !== fullPath)
  }

  const selectedAncestor = selected.find((path) => path !== fullPath && isSameOrDescendant(fullPath, path))

  if (selectedAncestor !== undefined) {
    const withoutAncestor = selected.filter((path) => path !== selectedAncestor)
    const ancestorNode = findFacetNode(tree, selectedAncestor)
    if (!ancestorNode) {
      return withoutAncestor
    }

    const targetSegments = splitCategoryPath(fullPath)
    const ancestorSegments = splitCategoryPath(selectedAncestor)
    const additions: string[] = []
    let node = ancestorNode

    for (let i = ancestorSegments.length; i < targetSegments.length; i++) {
      const nextLabel = targetSegments[i]
      const nextNode = node.children.find((child) => child.label === nextLabel)
      for (const child of node.children) {
        if (child.label !== nextLabel) {
          additions.push(child.fullPath)
        }
      }
      if (!nextNode) {
        break
      }
      node = nextNode
    }

    return [...withoutAncestor, ...additions]
  }

  const withoutDescendants = selected.filter((path) => !isSameOrDescendant(path, fullPath))
  let result = [...withoutDescendants, fullPath]
  let currentPath = fullPath

  while (true) {
    const segments = splitCategoryPath(currentPath)
    if (segments.length <= 1) {
      break
    }

    const parentPath = segments.slice(0, -1).join(CATEGORY_PATH_SEPARATOR)
    const parentNode = findFacetNode(tree, parentPath)
    if (!parentNode || parentNode.children.length === 0) {
      break
    }

    const allChildrenSelected = parentNode.children.every((child) => result.includes(child.fullPath))
    if (!allChildrenSelected) {
      break
    }

    const childPaths = new Set(parentNode.children.map((child) => child.fullPath))
    result = result.filter((path) => !childPaths.has(path))
    result.push(parentPath)
    currentPath = parentPath
  }

  return result
}

/** Higher count first; ties broken alphabetically by label. */
export function compareByCountThenLabel<T extends { count: number; label: string }>(a: T, b: T): number {
  if (b.count !== a.count) {
    return b.count - a.count
  }
  return a.label.localeCompare(b.label, "en")
}

/** fullPaths of every node in `tree` that has at least one child (used to compute "expand all matches"). */
export function collectBranchPaths(tree: CategoryFacetNode[]): string[] {
  const paths: string[] = []

  function walk(nodes: CategoryFacetNode[]): void {
    for (const node of nodes) {
      if (node.children.length > 0) {
        paths.push(node.fullPath)
        walk(node.children)
      }
    }
  }

  walk(tree)

  return paths
}
