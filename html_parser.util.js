import { parseDocument } from 'htmlparser2'

import { CLASS_TYPE_TAGS, TAG_TYPE_MAP, VOID_ELEMENTS } from './constants.js'

const getClassList = el => (el.attribs?.class || '').split(/\s+/).filter(Boolean)

const toCamelCase = value => value.replace(/-([a-z])/g, (_, char) => char.toUpperCase())

const parseAttributeValue = value => {
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}

const getDataAttributes = attribs => Object.entries(attribs || {}).reduce((acc, [name, value]) => {
  if (!name.startsWith('data-')) return acc

  acc[toCamelCase(name.slice(5))] = parseAttributeValue(value)
  return acc
}, {})

const getTextContent = el => {
  const collectText = node => {
    if (node.type === 'text') return node.data
    return (node.children || []).map(collectText).join('')
  }

  return collectText(el).replace(/\s+/g, ' ').trim()
}

const buildChildren = el => {
  const childNodes = []

  for (const child of el.children || []) {
    if (child.type === 'tag' || child.type === 'style' || child.type === 'script') {
      childNodes.push(elementToNode(child))
    } else if (child.type === 'text' && !/^\s*$/.test(child.data)) {
      childNodes.push({ text: child.data })
    }
  }

  if (el.name === 'style' && el.children?.some(child => child.type === 'text')) {
    const textContent = el.children.map(child => child.data || '').join('')
    return [{ type: 'style', children: [{ text: textContent }] }]
  }

  return childNodes
}

const elementToNode = el => {
  const classList = getClassList(el)
  const usesClassAsType = CLASS_TYPE_TAGS.has(el.name)

  const type = usesClassAsType ? classList[0] : (TAG_TYPE_MAP[el.name] || el.name)
  const remainingClasses = usesClassAsType ? classList.slice(1) : classList

  const {
    id,
    class: _class,
    'data-editable': dataEditable,
    'data-reorderable': dataReorderable,
    ...restAttribs
  } = el.attribs || {}
  const dataAttributes = getDataAttributes(restAttribs)
  const regularAttributes = Object.entries(restAttribs || {}).reduce((acc, [name, value]) => {
    if (name.startsWith('data-')) return acc
    acc[name] = parseAttributeValue(value)
    return acc
  }, {})

  const hasTagChildren = (el.children || []).some(child => child.type === 'tag')
  const children = el.name === 'style' ? [] : (hasTagChildren ? buildChildren(el) : [])
  const node = {
    type,
    ...(id && { id }),
    ...(remainingClasses.length > 0 && { className: remainingClasses.join(' ') }),
    ...(dataEditable !== undefined && { editable: dataEditable === 'true' }),
    ...(dataReorderable !== undefined && { reorderable: dataReorderable === 'true' }),
    ...dataAttributes,
    ...(Object.keys(regularAttributes).length > 0 && { attributes: regularAttributes }),
  }

  if (el.name === 'style') {
    node.children = [{
      text: getTextContent(el),
      type: 'style',
      'data-editable': false,
    }]
  } else if (children.length > 0) {
    node.children = children
  } else if (!VOID_ELEMENTS.has(el.name)) {
    const textContent = getTextContent(el)
    if (textContent) {
      node.children = [{ text: textContent }]
    } else {
      node.children = []
    }
  } else {
    node.children = []
  }

  return node
}

const findChildTag = (parent, tagName) => (parent.children || []).find(child => child.type === 'tag' && child.name === tagName) || null

export const htmlToOneLine = html => html.replace(/\n/g, '').replace(/\s+/g, ' ').trim()

const _walkEditable = (nodes, reorderableIds, parentContext) => {
  const result = []

  for (const node of nodes ?? []) {
    if (!node) continue

    const context = node.context ?? parentContext
    const hasReorderableChildren = !!node.hasReorderable
    const isReorderable = !!node.reorderable
    const isEditable = !!node.editable

    if (hasReorderableChildren || isReorderable || isEditable) {
      if (hasReorderableChildren) {
        reorderableIds.add(node.id)
        result.push({ id: node.id, children: _walkEditable(node.children ?? [], reorderableIds, context) })
      } else if (node.children?.length) {
        const textChild = node.children.find(child => child?.text !== undefined)
        if (textChild) {
          result.push({ id: node.id, text: textChild.text })
        } else {
          result.push({ id: node.id, children: _walkEditable(node.children, reorderableIds, context) })
        }
      }
    } else if (node.children?.length) {
      result.push(..._walkEditable(node.children, reorderableIds, context))
    }
  }

  return result
}

export const extractEditable = parsedDoc => {
  const reorderableIds = new Set()
  const editableNodes = _walkEditable(parsedDoc?.body ?? [], reorderableIds, undefined)
  return { editableNodes, reorderableIds: Array.from(reorderableIds) }
}

export const parseHtmlToJson = html => {
  const document = parseDocument(html)
  const htmlNode = (document.children || []).find(child => child.type === 'tag' && child.name === 'html')

  if (!htmlNode) {
    throw new Error('Could not find <html> in the provided HTML')
  }

  const headNode = findChildTag(htmlNode, 'head')
  const bodyNode = findChildTag(htmlNode, 'body')

  return {
    type: 'document',
    ...(htmlNode.attribs?.lang && { lang: htmlNode.attribs.lang }),
    head: headNode ? buildChildren(headNode) : [],
    body: bodyNode ? buildChildren(bodyNode) : [],
  }
}

