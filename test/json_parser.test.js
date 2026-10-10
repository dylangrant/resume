import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'fs'

import { htmlToOneLine, parseHtmlToJson } from '../html_parser.util.js'
import { formatCss, jsonToHtml } from '../json_parser.util.js'

const doc = body => ({ type: 'document', lang: 'en', head: [{ type: 'title', children: [{ text: 'R' }] }], body })

describe('jsonToHtml', () => {
  test('renders empty shell for invalid input', () => {
    const html = jsonToHtml(null, 'developmentMode')
    assert.match(html, /^<!DOCTYPE html>\n<html lang="en">/)
    assert.match(html, /<body>\n\n<\/body>/)
  })

  test('development mode keeps classes, ids, data attributes', () => {
    const html = jsonToHtml(doc([{
      type: 'job',
      id: 'j',
      className: 'job-compact',
      editable: true,
      reorderable: false,
      hasReorderable: true,
      attributes: { hidden: true, role: 'x' },
      children: [{ text: 'a' }],
    }]), 'developmentMode')
    assert.match(html, /<article id="j" class="job job-compact" data-editable="true" data-reorderable="false" hidden role="x" data-has-reorderable="true">a<\/article>/)
    assert.match(html, /<title>R<\/title>/)
  })

  test('escapes text', () => {
    const html = jsonToHtml(doc([{ type: 'paragraph', children: [{ text: '<a> & b' }] }]), 'developmentMode')
    assert.match(html, /<p>&lt;a&gt; &amp; b<\/p>/)
  })

  test('renders void elements without closing tag', () => {
    const html = jsonToHtml(doc([{ type: 'hr', children: [] }]), 'developmentMode')
    assert.match(html, /<hr>/)
    assert.doesNotMatch(html, /<\/hr>/)
  })

  test('separates block types with blank lines', () => {
    const html = jsonToHtml(doc([{
      type: 'section',
      children: [
        { type: 'skills-group', children: [{ text: 'a' }] },
        { type: 'skills-group', children: [{ text: 'b' }] },
      ],
    }]), 'developmentMode')
    assert.match(html, /<div class="skills-group">a<\/div>\n\n\s+<div class="skills-group">b<\/div>/)
  })

  test('export mode inlines merged styles and drops head/classes', () => {
    const html = jsonToHtml(doc([{ type: 'job', id: 'j', className: 'job-compact', editable: true, children: [{ text: 'a' }] }]))
    assert.match(html, /<head><meta charset="UTF-8"><\/head>/)
    assert.match(html, /<article id="j" style="margin-bottom:0.7rem">a<\/article>/)
    assert.doesNotMatch(html, /class=|data-|<title>/)
  })

  test('export mode omits style attr for unstyled nodes', () => {
    const html = jsonToHtml(doc([{ type: 'paragraph', children: [{ text: 'a' }] }]))
    assert.match(html, /<p>a<\/p>/)
  })
})

describe('formatCss', () => {
  test('one declaration per line, blank line between rules, comment attached', () => {
    assert.equal(
      formatCss('a { color: red; margin: 0; } /* B */ .b { x: 1 }', '  '),
      '  a {\n    color: red;\n    margin: 0;\n  }\n\n  /* B */\n  .b {\n    x: 1;\n  }',
    )
  })

  test('indents nested at-rules without trailing blank lines', () => {
    assert.equal(
      formatCss('@media print { a { x: 1; } b { y: 2; } }'),
      '@media print {\n  a {\n    x: 1;\n  }\n\n  b {\n    y: 2;\n  }\n}',
    )
  })

  test('to-html reproduces index.html <head> and <style> exactly', () => {
    const original = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    const regenerated = jsonToHtml(parseHtmlToJson(original), 'developmentMode')
    const upToStyleEnd = html => html.slice(0, html.indexOf('</style>'))
    assert.equal(upToStyleEnd(regenerated), upToStyleEnd(original))
  })
})

describe('round trip', () => {
  test('index.html -> json -> html is stable', () => {
    const original = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    const regenerated = jsonToHtml(parseHtmlToJson(original), 'developmentMode')
    assert.equal(htmlToOneLine(regenerated), htmlToOneLine(original))
  })

  test('json -> html -> json is stable', () => {
    const tree = parseHtmlToJson(readFileSync(new URL('../index.html', import.meta.url), 'utf8'))
    assert.deepEqual(parseHtmlToJson(jsonToHtml(tree, 'developmentMode')), tree)
  })

  test('committed resume.json matches index.html', () => {
    const json = JSON.parse(readFileSync(new URL('../resume.json', import.meta.url), 'utf8'))
    const tree = parseHtmlToJson(readFileSync(new URL('../index.html', import.meta.url), 'utf8'))
    assert.deepEqual(json.rawTree, tree)
  })
})
