// core/plugins-loader.js — تحميل كل ملفات plugins/ إلى global.plugins
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

export const PLUGINS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'plugins')

let loadedOnce = false

// تحميل (أو إعادة تحميل) بلوقن واحد. لو فيه خطأ يرمي استثناء ولا يلمس النسخة القديمة الشغالة
export async function loadPlugin(file) {
  const url =
    pathToFileURL(path.join(PLUGINS_DIR, file)).href +
    `?t=${Date.now()}-${Math.random().toString(36).slice(2)}`
  const mod = await import(url)
  let plugin = mod.default
  if (!(typeof plugin === 'function' || (plugin && typeof plugin === 'object'))) {
    if (typeof mod.before === 'function' || typeof mod.all === 'function') {
      // بلوقن مكتوب بتصدير مسمّى (export async function before)
      plugin = { before: mod.before, all: mod.all }
    } else if (Object.keys(mod).length) {
      // ملف مساعد (مثل ai-helper.js): يُستورد من بلوقنات ثانية، مو أمر
      removePlugin(file)
      return null
    } else {
      throw new Error('ما فيه export default')
    }
  }
  global.plugins = global.plugins || {}
  global.plugins[file] = plugin
  if (global.panelDisabled?.has('p1:' + file)) plugin.disabled = true
  return plugin
}

export function removePlugin(file) {
  if (global.plugins) delete global.plugins[file]
}

export async function loadPlugins({ force = false } = {}) {
  if (loadedOnce && !force) return { ok: Object.keys(global.plugins || {}).length, failed: [] }

  global.plugins = global.plugins || {}

  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
  const failed = []
  let ok = 0
  let helpers = 0

  for (const file of files) {
    try {
      if (await loadPlugin(file)) ok++
      else helpers++
    } catch (e) {
      failed.push([file, String(e?.message || e).split('\n')[0]])
    }
  }

  loadedOnce = true
  console.log(`🔌 البلوقنات: تحميل ${ok} من ${files.length}${helpers ? ` (+${helpers} ملف مساعد)` : ''}`)
  for (const [file, reason] of failed) console.log(`   ⚠️ ${file}: ${reason}`)

  return { ok, failed }
}
