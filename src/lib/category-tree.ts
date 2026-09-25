import categoryTree from "@/data/category_tree.json"

export const ROOT_CATEGORY = "Dental Supplies"

export type CategoryPath = string[]

export interface CategoryNode {
  name: string
  children?: CategoryNode[]
}

export interface LeafPathEntry {
  path: CategoryPath
  label: string
}

export interface CategoryLevels {
  categoryLevel1?: string
  categoryLevel2?: string
  categoryLevel3?: string
  categoryLevel4?: string
  categoryLevel5?: string
}

const ROOTS: readonly CategoryNode[] = categoryTree as CategoryNode[]

// Category names contain spaces, so a space separator would let ["A B", "C"] and ["A", "B C"]
// collide on the same key. U+001F (unit separator) never appears in a category name.
const PATH_KEY_SEPARATOR = "\u001f"

function pathKey(path: CategoryPath): string {
  return path.join(PATH_KEY_SEPARATOR)
}

const nodeIndex = new Map<string, CategoryNode>()
const leafPaths: LeafPathEntry[] = []

function indexNodes(nodes: readonly CategoryNode[], parentPath: CategoryPath): void {
  for (const node of nodes) {
    const path = [...parentPath, node.name]
    nodeIndex.set(pathKey(path), node)

    if (node.children && node.children.length > 0) {
      indexNodes(node.children, path)
    } else {
      leafPaths.push({ path, label: path.join(" > ") })
    }
  }
}

indexNodes(ROOTS, [])

export const LEAF_PATHS: readonly LeafPathEntry[] = leafPaths

export function getChildren(path: CategoryPath): readonly CategoryNode[] {
  if (path.length === 0) {
    return ROOTS
  }

  const node = nodeIndex.get(pathKey(path))
  if (!node) {
    return []
  }

  return node.children ?? []
}

export function isLeafPath(path: CategoryPath): boolean {
  if (path.length === 0) {
    return false
  }

  const node = nodeIndex.get(pathKey(path))
  if (!node) {
    return false
  }

  return !node.children || node.children.length === 0
}

export function searchLeafPaths(query: string, limit = 50): LeafPathEntry[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) {
    return []
  }

  const tokens = trimmed.toLowerCase().split(/\s+/)
  const results: LeafPathEntry[] = []

  for (const entry of LEAF_PATHS) {
    const label = entry.label.toLowerCase()
    if (tokens.every((token) => label.includes(token))) {
      results.push(entry)
      if (results.length >= limit) {
        break
      }
    }
  }

  return results
}

export function categoryPathToLevels(path: CategoryPath): CategoryLevels {
  const levels: CategoryLevels = { categoryLevel1: ROOT_CATEGORY }
  const levelKeys = ["categoryLevel2", "categoryLevel3", "categoryLevel4", "categoryLevel5"] as const

  for (const [i, key] of levelKeys.entries()) {
    const value = path[i]
    if (value !== undefined) {
      levels[key] = value
    }
  }

  return levels
}

export function levelsToCategoryPath(levels: CategoryLevels): CategoryPath | null {
  const level1 = levels.categoryLevel1?.trim()
  if (level1 !== ROOT_CATEGORY) {
    return null
  }

  const levelKeys = ["categoryLevel2", "categoryLevel3", "categoryLevel4", "categoryLevel5"] as const
  const path: CategoryPath = []

  for (const key of levelKeys) {
    const value = levels[key]?.trim()
    if (!value) {
      break
    }
    path.push(value)
  }

  if (path.length === 0) {
    return null
  }

  return isLeafPath(path) ? path : null
}

export function formatLegacyCategory(levels: CategoryLevels): string | null {
  const levelKeys = ["categoryLevel1", "categoryLevel2", "categoryLevel3", "categoryLevel4", "categoryLevel5"] as const

  const parts = levelKeys.map((key) => levels[key]?.trim()).filter((value): value is string => Boolean(value))

  if (parts.length === 0) {
    return null
  }

  return parts.join(" > ")
}
