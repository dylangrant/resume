import { execFileSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

import { htmlToOneLine } from '../html_parser.util.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '..')
const originalHtmlPath = join(repoRoot, 'index.html')
const tempDir = mkdtempSync(join(tmpdir(), 'resume-roundtrip-'))
const tempJsonPath = join(tempDir, 'resume.json')
const generatedHtmlPath = join(tempDir, 'generated.html')

try {
  console.log('Generating temporary JSON from the original HTML...')
  execFileSync(process.execPath, ['index.js', 'to-json', originalHtmlPath, tempJsonPath], {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  console.log('Generating temporary HTML from that JSON...')
  execFileSync(process.execPath, ['index.js', 'to-html', tempJsonPath, generatedHtmlPath], {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  const originalHtml = readFileSync(originalHtmlPath, 'utf8')
  const generatedHtml = readFileSync(generatedHtmlPath, 'utf8')
  const normalizedOriginal = htmlToOneLine(originalHtml)
  const normalizedGenerated = htmlToOneLine(generatedHtml)

  if (normalizedOriginal !== normalizedGenerated) {
    console.error('HTML round-trip verification failed.')
    console.error(`Original: ${normalizedOriginal}`)
    console.error(`Generated: ${normalizedGenerated}`)
    process.exit(1)
  }

  console.log('HTML round-trip verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
