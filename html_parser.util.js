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

  const { id, 'data-editable': dataEditable, 'data-reorderable': dataReorderable } = el.attribs || {}

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
