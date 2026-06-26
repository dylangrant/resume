import { CLASS_TYPE_TAG_MAP, HTML_SHELL, TYPE_TAG_MAP } from './constants.js'

// Sibling groups containing one of these types get a blank line between
// each child, matching how the base resume separates repeated blocks
// (skill groups, job entries) but not consecutive headings/paragraphs.
const BLOCK_TYPES = new Set(['skills-group', 'job'])
const VOID_ELEMENTS = new Set(['meta', 'link', 'img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'])

const escapeHtml = text => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const resolveTag = type => CLASS_TYPE_TAG_MAP[type] || TYPE_TAG_MAP[type] || type

const buildClassList = node => CLASS_TYPE_TAG_MAP[node.type]
  ? [node.type, ...(node.className ? node.className.split(' ') : [])]
  : (node.className ? node.className.split(' ') : [])

const toKebabCase = value => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const buildAttrs = node => {
  const classList = buildClassList(node)
  const hasClassName = Boolean(node.className)
  const dataAttrs = Object.entries(node)
    .filter(([key]) => !['type', 'id', 'className', 'children', 'editable', 'reorderable', 'attributes'].includes(key))
    .map(([key, value]) => value !== undefined && `data-${toKebabCase(key)}="${value}"`)
    .filter(Boolean)

  const regularAttrs = Object.entries(node.attributes || {})
    .map(([key, value]) => value === true ? key : `${key}="${value}"`)

  const attrs = [
    node.id && `id="${node.id}"`,
    classList.length > 0 && (!hasClassName || classList.length > 1 || classList[0] !== node.type) && `class="${classList.join(' ')}"`,
    node.editable !== undefined && `data-editable="${node.editable}"`,
    node.reorderable !== undefined && `data-reorderable="${node.reorderable}"`,
    ...regularAttrs,
    ...dataAttrs,
  ].filter(Boolean)

  return attrs.length > 0 ? ` ${attrs.join(' ')}` : ''
}

const renderNode = (node, depth) => {
  const indent = '  '.repeat(depth)
  const tag = resolveTag(node.type)
  const attrs = buildAttrs(node)

  if (node.type === 'style') {
    return `${indent}<style${attrs}>${escapeHtml(node.children?.[0]?.text || '')}</style>`
  }

  const isTextLeaf = node.children?.length === 1 && node.children[0].text !== undefined

  if (isTextLeaf) {
    return `${indent}<${tag}${attrs}>${escapeHtml(node.children[0].text)}</${tag}>`
  }

  if (VOID_ELEMENTS.has(tag)) {
    return `${indent}<${tag}${attrs}>`
  }

  const innerHtml = renderChildren(node.children || [], depth + 1)
  return `${indent}<${tag}${attrs}>\n${innerHtml}\n${indent}</${tag}>`
}

const renderChildren = (nodes, depth, { forceBlank = false } = {}) => {
  const useBlankSeparator = forceBlank || nodes.some(node => BLOCK_TYPES.has(node.type))
  const separator = useBlankSeparator ? '\n\n' : '\n'

  return nodes.map(node => renderNode(node, depth)).join(separator)
}

const renderDocument = documentNode => {
  const langAttr = documentNode.lang ? ` lang="${documentNode.lang}"` : ''
  const headContent = renderChildren(documentNode.head || [], 2)
  const bodyContent = renderChildren(documentNode.body || [], 2, { forceBlank: true })

  return `<!DOCTYPE html>\n<html${langAttr}>\n\n<head>\n${headContent}\n</head>\n\n<body>\n${bodyContent}\n</body>\n\n</html>\n`
}

export const jsonToHtml = input => {
  if (input && typeof input === 'object' && Array.isArray(input.body)) {
    return renderDocument(input)
  }

  if (Array.isArray(input)) {
    const content = renderChildren(input, 2, { forceBlank: true })
    return `${HTML_SHELL.before}${content}${HTML_SHELL.after}\n`
  }

  return renderDocument({
    lang: 'en',
    head: [],
    body: [],
  })
}
