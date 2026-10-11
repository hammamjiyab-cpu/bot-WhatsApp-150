// Rename the bot everywhere with one command (works on Termux too):
//   node tools/rename.js "Hammam Bot" "My New Name"
// Replaces the visible bot name inside plugins/messages. (core/credits.js is never touched.)
import fs from 'fs'
import path from 'path'

const [, , oldName, newName] = process.argv
if (!oldName || !newName) {
  console.log('Usage: node tools/rename.js "Hammam Bot" "My New Name"')
  process.exit(1)
}
if (/['"`\\$]/.test(newName)) {
  console.log('The new name must not contain quotes, backticks, backslashes or $.')
  process.exit(1)
}

const SKIP_DIRS = new Set(['node_modules', 'session', 'subbots', 'cookies', '.git', 'tmp', 'data'])
const SKIP_FILES = new Set(['core/credits.js', 'core/NIXCODE.js'])
let files = 0, hits = 0

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    const rel = path.relative(process.cwd(), full).split(path.sep).join('/')
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full); continue }
    if (!/\.(js|html)$/.test(e.name) || SKIP_FILES.has(rel)) continue
    const text = fs.readFileSync(full, 'utf8')
    if (!text.includes(oldName)) continue
    hits += text.split(oldName).length - 1
    fs.writeFileSync(full, text.split(oldName).join(newName))
    files++
  }
}
walk(process.cwd())
console.log(`Done: ${hits} replacements in ${files} files.`)
console.log('Tip: also set BOT_NAME=' + newName + ' in .env')
