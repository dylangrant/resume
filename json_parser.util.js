import { CLASS_TYPE_TAG_MAP, HTML_SHELL, TYPE_TAG_MAP } from './constants.js'

// Sibling groups containing one of these types get a blank line between
// each child, matching how the base resume separates repeated blocks
// (skill groups, job entries) but not consecutive headings/paragraphs.
const BLOCK_TYPES = new Set(['skills-group', 'job'])

const escapeHtml = text => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const resolveTag = type => CLASS_TYPE_TAG_MAP[type] || TYPE_TAG_MAP[type] || type

const buildClassList = node => CLASS_TYPE_TAG_MAP[node.type]
  ? [node.type, ...(node.className ? node.className.split(' ') : [])]
  : (node.className ? node.className.split(' ') : [])

const buildAttrs = node => {
  const classList = buildClassList(node)

  const attrs = [
    node.id && `id="${node.id}"`,
    classList.length > 0 && `class="${classList.join(' ')}"`,
    node.editable !== undefined && `data-editable="${node.editable}"`,
    node.reorderable !== undefined && `data-reorderable="${node.reorderable}"`,
  ].filter(Boolean)

  return attrs.length > 0 ? ` ${attrs.join(' ')}` : ''
}

const renderNode = (node, depth) => {
  const indent = '  '.repeat(depth)
  const tag = resolveTag(node.type)
  const attrs = buildAttrs(node)

  const isTextLeaf = node.children.length === 1 && node.children[0].text !== undefined

  if (isTextLeaf) {
    return `${indent}<${tag}${attrs}>${escapeHtml(node.children[0].text)}</${tag}>`
  }

  const innerHtml = renderChildren(node.children, depth + 1)
  return `${indent}<${tag}${attrs}>\n${innerHtml}\n${indent}</${tag}>`
}

const renderChildren = (nodes, depth, { forceBlank = false } = {}) => {
  const useBlankSeparator = forceBlank || nodes.some(node => BLOCK_TYPES.has(node.type))
  const separator = useBlankSeparator ? '\n\n' : '\n'

  return nodes.map(node => renderNode(node, depth)).join(separator)
}

export const jsonToHtml = nodes => {
  const content = renderChildren(nodes, 2, { forceBlank: true })
  return `${HTML_SHELL.before}${content}${HTML_SHELL.after}\n`
}
