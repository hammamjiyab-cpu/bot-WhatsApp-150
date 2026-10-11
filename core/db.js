// core/db.js — قاعدة بيانات محلية بسيطة يعتمد عليها هيندر 2 والبلوقنات
// global.db.data.{users,chats,settings,badwords,...} + readData/writeData
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'database.json')
const SAVE_EVERY_MS = 30 * 1000

const emptyData = () => ({ users: {}, chats: {}, settings: {}, badwords: {}, stats: {} })

function readFile() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return { ...emptyData(), ...parsed }
  } catch {
    return emptyData()
  }
}

let dirty = true

function save() {
  if (!global.db?.data || !dirty) return
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    const tmp = FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(global.db.data))
    fs.renameSync(tmp, FILE)
    dirty = false
  } catch (e) {
    console.error('[db] فشل الحفظ:', e.message)
  }
}

global.db = {
  data: readFile(),

  async readData(collection, id) {
    const col = this.data[collection]
    return col ? col[id] ?? null : null
  },

  async writeData(collection, id, value) {
    if (!this.data[collection]) this.data[collection] = {}
    this.data[collection][id] = value
    dirty = true
  },

  async write() {
    dirty = true
    save()
  }
}

global.loadDatabase = async function () {
  if (global.db.data == null) global.db.data = readFile()
  return global.db.data
}

// الحفظ دوري (لأن البلوقنات تعدّل global.db.data مباشرة)
setInterval(() => {
  dirty = true
  save()
}, SAVE_EVERY_MS).unref?.()

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.once(sig, () => {
    dirty = true
    save()
    process.exit(0)
  })
}
process.once('beforeExit', () => {
  dirty = true
  save()
})

export default global.db
