import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const run = (...args) => spawnSync(process.execPath, ['index.js', ...args], { cwd: repoRoot, encoding: 'utf8' })

describe('index.js CLI', () => {
  let dir
  before(() => { dir = mkdtempSync(join(tmpdir(), 'resume-cli-')) })
  after(() => rmSync(dir, { recursive: true, force: true }))

  test('prints usage with no command and exits 0', () => {
    const res = run()
    assert.equal(res.status, 0)
    assert.match(res.stdout, /Usage:/)
  })

  test('exits 1 on unknown command', () => {
    assert.equal(run('bogus').status, 1)
  })

  test('to-json then to-html', () => {
    const htmlIn = join(dir, 'in.html')
    const jsonOut = join(dir, 'out.json')
    const htmlOut = join(dir, 'out.html')
    writeFileSync(htmlIn, '<html lang="en"><head></head><body><p id="p" data-editable="true">Hi</p></body></html>')

    assert.equal(run('to-json', htmlIn, jsonOut).status, 0)
    const json = JSON.parse(readFileSync(jsonOut, 'utf8'))
    assert.deepEqual(json.editableNodes, [{ id: 'p', text: 'Hi' }])
    assert.deepEqual(json.reorderableIds, [])
    assert.equal(json.rawTree.body[0].id, 'p')

    assert.equal(run('to-html', jsonOut, htmlOut).status, 0)
    assert.match(readFileSync(htmlOut, 'utf8'), /<p id="p" data-editable="true">Hi<\/p>/)
  })
})
