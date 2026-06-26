import {
  BLOCK_TYPES,
  CLASS_TYPE_TAG_MAP,
  INLINE_STYLES,
  TYPE_TAG_MAP,
  VOID_ELEMENTS,
} from './constants.js'

const escapeHtml = text => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const resolveTag = type => CLASS_TYPE_TAG_MAP[type] || TYPE_TAG_MAP[type] || type

const buildClassList = node => CLASS_TYPE_TAG_MAP[node.type]
  ? [node.type, ...(node.className ? node.className.split(' ') : [])]
  : (node.className ? node.className.split(' ') : [])

const toKebabCase = value => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const buildAttrs = ({ node, mode }) => {
  const classList = buildClassList(node)

  if (mode === 'exportMode') {
    const classList = buildClassList(node)

    // Merge styles so later classes override earlier ones (job-compact overrides job)
    const styleMap = {}
    for (const cls of classList) {
      const s = INLINE_STYLES[cls]
      if (!s) continue
      for (const decl of s.split(';').filter(Boolean)) {
        const colonIdx = decl.indexOf(':')
        if (colonIdx === -1) continue
        const prop = decl.slice(0, colonIdx).trim()
        const val = decl.slice(colonIdx + 1).trim()
        styleMap[prop] = val
      }
    }

    const inlineStyle = Object.entries(styleMap)
      .map(([p, v]) => `${p}:${v}`)
      .join(';')

    const attrs = [
      node.id && `id="${node.id}"`,
      inlineStyle && `style="${inlineStyle}"`,
    ].filter(Boolean)

    return attrs.length > 0 ? ` ${attrs.join(' ')}` : ''
  }

  const dataAttrs = Object.entries(node)
    .filter(([key]) => !['type', 'id', 'className', 'children', 'editable', 'reorderable', 'attributes'].includes(key))
    .map(([key, value]) => value !== undefined && `data-${toKebabCase(key)}="${value}"`)
    .filter(Boolean)

  const regularAttrs = Object.entries(node.attributes || {})
    .map(([key, value]) => value === true ? key : `${key}="${value}"`)

  const attrs = [
    node.id && `id="${node.id}"`,
    classList.length > 0 && `class="${classList.join(' ')}"`,
    node.editable !== undefined && `data-editable="${node.editable}"`,
    node.reorderable !== undefined && `data-reorderable="${node.reorderable}"`,
    ...regularAttrs,
    ...dataAttrs,
  ].filter(Boolean)

  return attrs.length > 0 ? ` ${attrs.join(' ')}` : ''
}

const renderNode = ({ node, depth, mode }) => {
  const indent = '  '.repeat(depth)
  const tag = resolveTag(node.type)
  const attrs = buildAttrs({ node, mode })

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

  const innerHtml = renderChildren({ nodes: node.children || [], depth: depth + 1, mode })
  return `${indent}<${tag}${attrs}>\n${innerHtml}\n${indent}</${tag}>`
}

const renderChildren = ({ nodes, depth, forceBlank = false, mode }) => {
  const useBlankSeparator = forceBlank || nodes.some(node => BLOCK_TYPES.has(node.type))
  const separator = useBlankSeparator ? '\n\n' : '\n'

  return nodes.map(node => renderNode({ node, depth, mode })).join(separator)
}

const renderDocument = (documentNode, mode) => {
  const langAttr = documentNode.lang ? ` lang="${documentNode.lang}"` : ''
  const headContent = renderChildren({ nodes: documentNode.head || [], depth: 2, mode })
  const bodyContent = renderChildren({
    nodes: documentNode.body || [],
    forceBlank: true,
    depth: 2,
    mode,
  })

  if (mode === 'exportMode') {
    return `<!DOCTYPE html>\n<html${langAttr}>\n\n<head><meta charset="UTF-8"></head>\n\n<body>\n${bodyContent}\n</body>\n\n</html>\n`
  }

  return `<!DOCTYPE html>\n<html${langAttr}>\n\n<head>\n${headContent}\n</head>\n\n<body>\n${bodyContent}\n</body>\n\n</html>\n`
}

export const jsonToHtml = (input, mode = 'exportMode') => {
  if (input && typeof input === 'object' && Array.isArray(input.body)) {
    return renderDocument(input, mode)
  }

  const documentNode = {
    lang: 'en',
    head: [],
    body: [],
  }
  return renderDocument(documentNode, mode)
}
