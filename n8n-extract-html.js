// Tags whose semantic type is the tag name itself.
const TAG_TYPE_MAP = {
  header: 'header',
  section: 'section',
  h1: 'heading-one',
  h2: 'heading-two',
  h3: 'heading-three',
  h4: 'heading-four',
  h5: 'heading-five',
  h6: 'heading-six',
  p: 'paragraph',
  ul: 'bulleted-list',
  ol: 'numbered-list',
  li: 'list-item',
}

const TYPE_TAG_MAP = Object.fromEntries(
  Object.entries(TAG_TYPE_MAP).map(([tag, type]) => [type, tag])
)

// Sibling groups containing one of these types get a blank line between
// each child, matching how the base resume separates repeated blocks
// (skill groups, job entries) but not consecutive headings/paragraphs.
const BLOCK_TYPES = new Set(['skills-group', 'job'])
const VOID_ELEMENTS = new Set(['meta', 'link', 'img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'])


// Tags whose semantic type comes from their first CSS class instead of the
// tag name (e.g. <div class="skills-group"> -> type "skills-group").
const CLASS_TYPE_TAG_MAP = {
  'skills-group': 'div',
  job: 'article',
}

const INLINE_STYLES = {
  resume: 'font-family:Georgia;font-size:11pt;line-height:1.45;margin:0 auto;padding:0 1rem;background:#ffffff;color:#1a1a1a;line-height:1.45;max-width:7.5in;',
  name: 'font-family:Georgia;font-size:24pt;font-weight:bold;letter-spacing:0.02em;text-align:center;margin:0;',
  title: 'font-family:Georgia;font-size:12pt;font-style:italic;color:#444444;text-align:center;margin:0.2rem 0;',
  contact: 'font-family:Georgia;font-size:10pt;color:#444444;text-align:center;margin:0;',
  section: 'margin:0 0 1.6rem 0;',
  'section-heading': 'font-family:Georgia;font-size:13pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1.5px solid #1a1a1a;',
  'body-text': 'font-family:Georgia;font-size:11pt;display:inline;',
  'skills-label': 'font-family:Georgia;font-size:11pt;font-weight:bold;display:inline;',
  job: 'margin-bottom:0.85rem;',
  'job-company': 'font-family:Georgia;font-size:11.5pt;font-weight:bold;margin:0;',
  'job-role': 'font-family:Georgia;font-size:11pt;font-style:italic;color:#444444;margin:0;',
  'job-dates': 'font-family:Georgia;font-size:10pt;color:#444444;margin:0;',
  'job-bullets': 'margin:0;padding-left:1.1rem;',
  'job-desc': 'font-family:Georgia;font-size:11pt;margin-top:0.1rem;margin-bottom:0;',
  'skills-group': 'margin-bottom:0.45rem;',
  job: 'margin-bottom:0.85rem;',
  'job-compact': 'margin-bottom:0.7rem;',
  header: 'text-align:center;margin-bottom:1.6rem;',
};

const CLASS_TYPE_TAGS = new Set(Object.values(CLASS_TYPE_TAG_MAP))

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

const jsonToHtml = (input, mode = 'exportMode') => {
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

// ---- Merge Claude's tailored edits back into the full resume tree ----
//
// Expects this item's json to contain:
//   - resumeTree: the full { type, lang, head, body } document, passed
//     through from the extract-editable-nodes step
//   - the tailored edits, either already parsed (editedNodes /
//     editableNodes) or as a raw Anthropic Messages API response
//     ({ content: [{ type: 'text', text: '<json array string>' }] })
//
// Adjust the two lines below if your upstream fields are named differently.
const input = $input.first().json;
const resumeTree = input.resumeTree;

const editsRaw = input.content?.[0]?.text ?? input.editedNodes ?? input.editableNodes;
const edits = typeof editsRaw === 'string' ? JSON.parse(editsRaw) : (editsRaw ?? []);

const editsById = new Map(edits.map(edit => [edit.id, edit]));

const applyEdits = nodes => (nodes ?? []).map(node => {
  if (!node) return node;

  const edit = editsById.get(node.id);

  if (edit?.text !== undefined) {
    return { ...node, children: [{ text: edit.text }] };
  }

  if (edit?.children) {
    const mergedChildren = node.children.map((child, i) => {
      const editedChild = edit.children[i];
      return editedChild ? { ...child, children: [{ text: editedChild.text }] } : child;
    });
    return { ...node, children: mergedChildren };
  }

  if (node.children?.length) {
    return { ...node, children: applyEdits(node.children) };
  }

  return node;
});

const mergedTree = { ...resumeTree, body: applyEdits(resumeTree.body) };

// ---- Render the merged tree to HTML ----
const html = jsonToHtml(mergedTree);

return [{ json: { html, id: input.id, name: input.name, title: input.title } }];