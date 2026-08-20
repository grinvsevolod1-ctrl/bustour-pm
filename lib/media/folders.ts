/** Media folders (nested). `root` = unfiled files (folder_id IS NULL). */

export type MediaFolder = {
  id: string
  name: string
  parentId: string | null
  createdAt: number
}

/** Папка с вычисленной глубиной и путём — для дерева и хлебных крошек. */
export type MediaFolderNode = MediaFolder & {
  depth: number
  children: MediaFolderNode[]
}

/** Query param → SQL fragment. `all` = no folder filter; `root` = null; else exact id. */
export function folderFilterSql(
  folder: string | undefined | null,
): { sql: string; args: string[] } | null {
  if (folder == null || folder === "" || folder === "all") return null
  if (folder === "root") return { sql: "folder_id IS NULL", args: [] }
  return { sql: "folder_id = ?", args: [folder] }
}

export function normalizeFolderName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ")
  if (!name || name.length > 80) return null
  return name
}

/**
 * Строит дерево папок из плоского списка. Сироты (родитель удалён/не найден)
 * поднимаются в корень, чтобы не потеряться. Дети сортируются по имени.
 */
export function buildFolderTree(folders: MediaFolder[]): MediaFolderNode[] {
  const byId = new Map<string, MediaFolderNode>()
  for (const f of folders) {
    byId.set(f.id, { ...f, depth: 0, children: [] })
  }
  const roots: MediaFolderNode[] = []
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : null
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const sortRec = (nodes: MediaFolderNode[], depth: number) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "ru"))
    for (const n of nodes) {
      n.depth = depth
      sortRec(n.children, depth + 1)
    }
  }
  sortRec(roots, 0)
  return roots
}

/** Плоский список в порядке обхода дерева (для рендера с отступами). */
export function flattenFolderTree(nodes: MediaFolderNode[]): MediaFolderNode[] {
  const out: MediaFolderNode[] = []
  const walk = (list: MediaFolderNode[]) => {
    for (const n of list) {
      out.push(n)
      walk(n.children)
    }
  }
  walk(nodes)
  return out
}

/** Путь от корня до папки (хлебные крошки). Пустой массив, если id не найден. */
export function folderPath(folders: MediaFolder[], id: string | null): MediaFolder[] {
  if (!id) return []
  const byId = new Map(folders.map((f) => [f.id, f]))
  const path: MediaFolder[] = []
  let current = byId.get(id) ?? null
  const guard = new Set<string>()
  while (current && !guard.has(current.id)) {
    guard.add(current.id)
    path.unshift(current)
    current = current.parentId ? (byId.get(current.parentId) ?? null) : null
  }
  return path
}

/** id всех потомков папки (не включая её саму). */
export function collectDescendantIds(folders: MediaFolder[], id: string): string[] {
  const childrenOf = new Map<string | null, string[]>()
  for (const f of folders) {
    const key = f.parentId
    const list = childrenOf.get(key) ?? []
    list.push(f.id)
    childrenOf.set(key, list)
  }
  const result: string[] = []
  const stack = [...(childrenOf.get(id) ?? [])]
  while (stack.length) {
    const cur = stack.pop() as string
    result.push(cur)
    stack.push(...(childrenOf.get(cur) ?? []))
  }
  return result
}
