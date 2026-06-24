import { parseDocument } from 'htmlparser2'
import { is, has, isEmpty } from 'rambda'

import { formatHtml, formattingTags, scId } from './constants.js'

export const htmlToOneLine = (html) => {
  return html.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
}

export const parseTextToJSObject = (input) => {
  const regex = /^(?!<[^>]+>).*<[^>]+>.*(?<!<[^>]+>)$/

  const processedInput = regex.test(input) ? `<p>${input}</p>` : input

  const defaultObject = [{
    attr: {}, // TODO: need all the html attributes
    children: [{ text: processedInput ?? '' }],
    type: 'p',
  }]

  const shouldUseDefaultObj = processedInput === null || processedInput === '' || input === null || input === '' || !/<[^>]+>/g.test(input)

  if (shouldUseDefaultObj) {
    return defaultObject
  }

  const usedScIds = new Set()

  const traverse = (node, parentAttrs = {}) => {
    const { attribs = {}, name, type, data } = node
    const isFormattingTag = !!formattingTags[name]

    if (type === 'text') {
      return { ...parentAttrs, text: data }
    }

    if (type === 'comment') {
      // Comments are much different, so we can't use the same return object as other nodes
      return {
        ...parentAttrs,
        attr: attribs,
        commentedHtml: data,
        type,
      }
    }

    if (type === 'tag') {
      const tagFormatting = isFormattingTag ? formattingTags[name](node) : {}
      const combinedAttrs = { ...parentAttrs, ...tagFormatting }

      // Handle scId duplication from shopify updates
      if (has(scId, attribs)) {
        if (usedScIds.has(attribs[scId])) {
          // If the scId is a duplicate, replace it with a new one
          attribs[scId] = nanoid();
        }
        usedScIds.add(attribs[scId]); // Track the new or existing scId
      } else if (!isFormattingTag) {
        // Assign a new scId if not present and it's not a formatting tag
        attribs[scId] = nanoid();
        usedScIds.add(attribs[scId]);
      }

      const mapChildren = (node.children || [])
        .flatMap(child => traverse(child, combinedAttrs))
        .filter(Boolean)
      const children = isEmpty(mapChildren)
        ? [{ text: '' }]
        : mapChildren

      return isFormattingTag
        ? children
        : {
          attr: attribs,
          children,
          type: name,
        }
    }
  }

  const reductedInput = htmlToOneLine(processedInput)
  const rootNode = parseDocument(reductedInput)
  const flatMap = rootNode.children.flatMap(traverse)
  return flatMap
}

export const objectToHtml = (rteValue) => {
  const traverse = (node) => {
    const { attr, children, type, text, ...formatting } = node

    if (!!text) {
      const formattedHtml = Object.entries(formatting)
        .reduce((accum, item) => {
          return item[1] === true
            ? formatHtml(item[0], accum)
            : accum
        }, `${text}`)

      return formattedHtml
    }

    // Attributes to string
    const attributesStr = Object.entries(attr || {})
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')

    // Process the children recursively
    const childrenHtml = (children || []).map(traverse).join('')

    // Construct the tag with its content
    return `<${type} ${attributesStr.trim()}>${childrenHtml}</${type}>`
  }

  const rteObject = is(String, rteValue) ? JSON.parse(rteValue) : rteValue
  return rteObject.map(traverse).join('')
}