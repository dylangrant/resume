import { has } from 'rambda'

function cssToCamelCase(styleString) {
  const styles = {};

  // Split the style string into individual declarations ("property: value")
  const declarations = styleString.split(';');

  declarations.forEach(declaration => {
    if (declaration) {
      // Split each declaration into property and value
      let [property, value] = declaration.split(':');

      // Trim whitespace and convert property name to camelCase
      property = property.trim().replace(/-([a-z])/g, (match, char) => char.toUpperCase());

      // Trim whitespace from value
      value = value.trim();

      // Add to styles object
      styles[property] = value;
    }
  });

  return styles;
}

// The parsing for htmlparser2 keeps the case of the tag
export const elementTags = {
  a: el => ({ type: 'a', url: el.getAttribute('href') }),
  blockquote: () => ({ type: 'blockquote' }),
  h1: () => ({ type: 'h1' }),
  h2: () => ({ type: 'h2' }),
  h3: () => ({ type: 'h3' }),
  h4: () => ({ type: 'h4' }),
  h5: () => ({ type: 'h5' }),
  h6: () => ({ type: 'h6' }),
  img: el => ({ type: 'img', url: el.getAttribute('src') }),
  li: () => ({ type: 'li' }),
  ol: () => ({ type: 'ol' }),
  p: () => ({ type: 'p' }),
  pre: () => ({ type: 'code' }),
  ul: () => ({ type: 'ul' }),
}

export const formattingTags = {
  b: () => ({ bold: true }),
  code: () => ({ code: true }),
  del: () => ({ strikethrough: true }),
  em: () => ({ italic: true }),
  i: () => ({ italic: true }),
  s: () => ({ strikethrough: true }),
  strong: () => ({ bold: true }),
  u: () => ({ underline: true }),
  span: (node) => {
    const { attribs: attributes = {} } = node
    const { style = {} } = attributes
    const parsedStyles = cssToCamelCase(style)
    const underline = has('textDecoration', parsedStyles) && parsedStyles.textDecoration === 'underline'

    const newObj = {
      ...attributes,
      ...parsedStyles,
      underline,
    }

    return newObj
  },
}

export const formatHtml = (key, html) => {
  switch (key) {
    case 'bold':
      return `<strong>${html}</strong>`
    case 'code':
      return `<code>${html}</code>`
    case 'strikethrough':
      return `<del>${html}</del>`
    case 'italic':
      return `<em>${html}</em>`
    case 'underline':
      return `<u>${html}</u>`
    default:
      return html
  }
}