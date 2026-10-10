import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { extractEditable, htmlToOneLine, parseHtmlToJson } from '../html_parser.util.js'

const wrap = (body, head = '') => `<!DOCTYPE html><html lang="en"><head>${head}</head><body>${body}</body></html>`

describe('htmlToOneLine', () => {
  test('collapses newlines and whitespace', () => {
    assert.equal(htmlToOneLine('  <p>\n  a   b\n</p>  '), '<p> a b</p>')
  })
})

describe('parseHtmlToJson', () => {
  test('throws without <html>', () => {
    assert.throws(() => parseHtmlToJson('<p>hi</p>'), /Could not find <html>/)
  })

  test('returns document shell with lang', () => {
    const doc = parseHtmlToJson(wrap(''))
    assert.deepEqual(doc, { type: 'document', lang: 'en', head: [], body: [] })
  })

  test('omits lang when absent', () => {
    const doc = parseHtmlToJson('<html><head></head><body></body></html>')
    assert.equal('lang' in doc, false)
  })

  test('maps tags to semantic types', () => {
    const { body } = parseHtmlToJson(wrap('<h1>Name</h1><p>Text</p><ul><li>One</li></ul>'))
    assert.deepEqual(body, [
      { type: 'heading-one', children: [{ text: 'Name' }] },
      { type: 'paragraph', children: [{ text: 'Text' }] },
      { type: 'bulleted-list', children: [{ type: 'list-item', children: [{ text: 'One' }] }] },
    ])
  })

  test('uses first class as type for div/article', () => {
    const { body } = parseHtmlToJson(wrap('<article class="job job-compact" id="j1"></article><div class="skills-group"></div>'))
    assert.deepEqual(body[0], { type: 'job', id: 'j1', className: 'job-compact', children: [] })
    assert.equal(body[1].type, 'skills-group')
    assert.equal('className' in body[1], false)
  })

  test('parses editable/reorderable and data attributes', () => {
    const { body } = parseHtmlToJson(wrap('<p id="a" class="x y" data-editable="true" data-reorderable="false" data-has-reorderable="true" data-context="exp">t</p>'))
    assert.deepEqual(body[0], {
      type: 'paragraph',
      id: 'a',
      className: 'x y',
      editable: true,
      reorderable: false,
      hasReorderable: true,
      context: 'exp',
      children: [{ text: 't' }],
    })
  })

  test('keeps regular attributes', () => {
    const { head } = parseHtmlToJson(wrap('', '<meta charset="UTF-8">'))
    assert.deepEqual(head, [{ type: 'meta', attributes: { charset: 'UTF-8' }, children: [] }])
  })

  test('normalizes whitespace in text leaves', () => {
    const { body } = parseHtmlToJson(wrap('<p>  a\n   b  </p>'))
    assert.deepEqual(body[0].children, [{ text: 'a b' }])
  })

  test('keeps mixed text and element children', () => {
    const { body } = parseHtmlToJson(wrap('<p>hi <span>there</span></p>'))
    assert.deepEqual(body[0].children, [{ text: 'hi ' }, { type: 'span', children: [{ text: 'there' }] }])
  })

  test('captures style text as non-editable style child', () => {
    const { head } = parseHtmlToJson(wrap('', '<style>body {\n  color: red; }</style>'))
    assert.deepEqual(head[0].children, [{ text: 'body { color: red; }', type: 'style', 'data-editable': false }])
  })
})

describe('extractEditable', () => {
  test('handles empty input', () => {
    assert.deepEqual(extractEditable(undefined), { editableNodes: [], reorderableIds: [] })
  })

  test('collects editable text, nested reorderables, and ids', () => {
    const doc = parseHtmlToJson(wrap(`
      <section>
        <h2 id="t" data-editable="true">Title</h2>
        <ul id="list" data-has-reorderable="true">
          <li id="i1" data-reorderable="true">One</li>
          <li id="i2" data-editable="true">Two</li>
          <li>Skip</li>
        </ul>
        <div class="skills-group" id="g" data-editable="true"><span>a</span><span id="s" data-editable="true">b</span></div>
      </section>`))
    assert.deepEqual(extractEditable(doc), {
      editableNodes: [
        { id: 't', text: 'Title' },
        { id: 'list', children: [{ id: 'i1', text: 'One' }, { id: 'i2', text: 'Two' }] },
        { id: 'g', children: [{ id: 's', text: 'b' }] },
      ],
      reorderableIds: ['list'],
    })
  })
})
