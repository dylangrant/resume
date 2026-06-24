import { readFileSync, writeFileSync } from 'fs'

import { parseHtmlToJson } from './html_parser.util.js'
import { jsonToHtml } from './json_parser.util.js'

const [command, arg1, arg2] = process.argv.slice(2)

const toJson = (htmlPath = 'index.html', jsonPath = 'resume.json') => {
  const html = readFileSync(htmlPath, 'utf-8')
  const json = parseHtmlToJson(html)
  writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`Wrote ${jsonPath} from ${htmlPath}`)
}

const toHtml = (jsonPath = 'resume.json', htmlPath = 'index.html') => {
  const json = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  const html = jsonToHtml(json)
  writeFileSync(htmlPath, html)
  console.log(`Wrote ${htmlPath} from ${jsonPath}`)
}

switch (command) {
  case 'to-json':
    toJson(arg1, arg2)
    break
  case 'to-html':
    toHtml(arg1, arg2)
    break
  default:
    console.log('Usage:')
    console.log('  node index.js to-json [htmlPath=index.html] [jsonPath=resume.json]')
    console.log('  node index.js to-html [jsonPath=resume.json] [htmlPath=index.html]')
    process.exit(command ? 1 : 0)
}
