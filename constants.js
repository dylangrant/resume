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
export const VOID_ELEMENTS = new Set(['meta', 'link', 'img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr', 'script', 'style'])


// Tags whose semantic type comes from their first CSS class instead of the
// tag name (e.g. <div class="skills-group"> -> type "skills-group").
export const CLASS_TYPE_TAG_MAP = {
  'skills-group': 'div',
  job: 'article',
}

export const CLASS_TYPE_TAGS = new Set(Object.values(CLASS_TYPE_TAG_MAP))

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