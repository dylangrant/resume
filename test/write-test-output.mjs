import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '..')

const fixturePath = join(repoRoot, 'test', 'fixtures', 'resume-tree.json')
const outputPath = join(repoRoot, 'test', 'output', 'editable-nodes-output.json')

const resumeTree = JSON.parse(readFileSync(fixturePath, 'utf8'))

function extractEditable(nodes, parentContext) {
  const result = []

  for (const node of nodes ?? []) {
    if (!node) continue

    const context = node.context ?? parentContext
    const hasReorderableChildren = !!node?.hasReorderable || !!node?.hasReorderableChildren
    const isReorderable = !!node?.reorderable
    const isEditable = !!node?.editable
    const shouldInclude = hasReorderableChildren || isReorderable || isEditable

    if (shouldInclude) {
      const entry = {
        id: node.id,
        isReorderable,
        isEditable,
        type: node.type,
        ...(context !== undefined && { context }),
      }

      if (hasReorderableChildren) {
        entry.hasReorderableChildren = true
        const childEntries = extractEditable(node.children ?? [], context)
        if (childEntries.length) {
          entry.children = childEntries
        }
      } else if (node.children?.length) {
        const textChild = node.children.find(child => child?.text !== undefined)
        if (textChild) {
          entry.text = textChild.text
        } else {
          const childEntries = extractEditable(node.children ?? [], context)
          if (childEntries.length) {
            entry.children = childEntries
          }
        }
      }

      result.push(entry)
    } else if (node.children?.length) {
      result.push(...extractEditable(node.children ?? [], context))
    }
  }

  return result
}

const editableNodes = extractEditable(resumeTree)
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, JSON.stringify({ editableNodes }, null, 2) + '\n')
console.log(`Wrote ${outputPath}`)
