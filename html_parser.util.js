import { parseDocument } from 'htmlparser2'

import { CLASS_TYPE_TAGS, TAG_TYPE_MAP } from './constants.js'

const findElementById = (nodes, id) => {
  for (const node of nodes) {
    if (node.type !== 'tag') continue
    if (node.attribs?.id === id) return node
    const found = findElementById(node.children || [], id)
    if (found) return found
  }
  return null
}

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

const elementToNode = el => {
  const classList = getClassList(el)
  const usesClassAsType = CLASS_TYPE_TAGS.has(el.name)

  const type = usesClassAsType ? classList[0] : (TAG_TYPE_MAP[el.name] || el.name)
  const remainingClasses = usesClassAsType ? classList.slice(1) : classList

  const {
    id,
    'data-editable': dataEditable,
    'data-reorderable': dataReorderable,
    ...restAttribs
  } = el.attribs || {}
  const dataAttributes = getDataAttributes(restAttribs)

  const childElements = (el.children || []).filter(child => child.type === 'tag')
  const children = childElements.length > 0
    ? childElements.map(elementToNode)
    : [{ text: getTextContent(el) }]

  return {
    type,
    ...(id && { id }),
    ...(remainingClasses.length > 0 && { className: remainingClasses.join(' ') }),
    ...(dataEditable !== undefined && { editable: dataEditable === 'true' }),
    ...(dataReorderable !== undefined && { reorderable: dataReorderable === 'true' }),
    ...dataAttributes,
    children,
  }
}

export const htmlToOneLine = html => html.replace(/\n/g, '').replace(/\s+/g, ' ').trim()

export const parseHtmlToJson = html => {
  const document = parseDocument(html)
  const resumeEl = findElementById(document.children, 'resume')

  if (!resumeEl) {
    throw new Error('Could not find <main id="resume"> in the provided HTML')
  }

  return resumeEl.children
    .filter(child => child.type === 'tag')
    .map(elementToNode)
}
