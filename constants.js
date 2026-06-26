// Tags whose semantic type is the tag name itself.
export const TAG_TYPE_MAP = {
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

export const TYPE_TAG_MAP = Object.fromEntries(
  Object.entries(TAG_TYPE_MAP).map(([tag, type]) => [type, tag])
)

// Sibling groups containing one of these types get a blank line between
// each child, matching how the base resume separates repeated blocks
// (skill groups, job entries) but not consecutive headings/paragraphs.
export const BLOCK_TYPES = new Set(['skills-group', 'job'])
export const VOID_ELEMENTS = new Set(['meta', 'link', 'img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'])


// Tags whose semantic type comes from their first CSS class instead of the
// tag name (e.g. <div class="skills-group"> -> type "skills-group").
export const CLASS_TYPE_TAG_MAP = {
  'skills-group': 'div',
  job: 'article',
}

export const CLASS_TYPE_TAGS = new Set(Object.values(CLASS_TYPE_TAG_MAP))
