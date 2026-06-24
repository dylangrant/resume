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

// Tags whose semantic type comes from their first CSS class instead of the
// tag name (e.g. <div class="skills-group"> -> type "skills-group").
export const CLASS_TYPE_TAG_MAP = {
  'skills-group': 'div',
  job: 'article',
}

export const CLASS_TYPE_TAGS = new Set(Object.values(CLASS_TYPE_TAG_MAP))

export const HTML_SHELL = {
  before: `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dylan Grant - Resume</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>
  <main id="resume" class="resume">
`,
  after: `
  </main>
</body>

</html>`,
}
