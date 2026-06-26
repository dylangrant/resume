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

export const INLINE_STYLES = {
  'resume-body': 'font-family:Georgia,serif;margin:0;padding: 2.25rem 1rem;background: #ffffff;color:#1a1a1a);font-size: 11pt;line-height: 1.45;',
  name: 'font-family:Georgia,serif;font-size:24pt;font-weight:bold;letter-spacing:0.02em;text-align:center;',
  title: 'font-family:Georgia,serif;font-size:12pt;font-style:italic;color:#444444;text-align:center;',
  contact: 'font-family:Georgia,serif;font-size:10pt;color:#444444;text-align:center;',
  'section-heading': 'font-family:Georgia,serif;font-size:13pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1.5px solid #1a1a1a;',
  'body-text': 'font-family:Georgia,serif;font-size:11pt;display:inline;',
  'skills-label': 'font-family:Georgia,serif;font-size:11pt;font-weight:bold;display:inline;',
  'job-company': 'font-family:Georgia,serif;font-size:11.5pt;font-weight:bold;',
  'job-role': 'font-family:Georgia,serif;font-size:11pt;font-style:italic;color:#444444;',
  'job-dates': 'font-family:Georgia,serif;font-size:10pt;color:#444444;',
  'job-bullets': 'margin:0;padding-left:1.1rem;',
  'job-desc': 'font-family:Georgia,serif;font-size:11pt;',
  'skills-group': 'margin-bottom:0.45rem;',
  job: 'margin-bottom:0.85rem;',
  'job-compact': 'margin-bottom:0.7rem;',
  header: 'text-align:center;margin-bottom:1.6rem;',
};