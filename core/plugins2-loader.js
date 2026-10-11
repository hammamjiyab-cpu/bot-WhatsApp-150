// core/plugins2-loader.js — بلوقن 2: أوامر الحماية (مجلد plugins2/)
// كل أمر ملف مستقل. الصيغة:
//   const plugin = async (ctx) => { await ctx.send('...') }
//   plugin.command = /^\.اسم(?: |$)/      // أو ['اسم'] أو 'اسم' (بدون نقطة)
//   plugin.help    = '*.اسم* — وصف'       // اختياري (يظهر في .اوامر) — نص أو مصفوفة
//   plugin.access  = 'elite'              // 'owner' | 'elite' (الافتراضي) | 'all'
//   plugin.group   = false                // true = القروبات فقط
//   plugin.priority = 10                  // الأصغر يُفحص أول
//   export default plugin
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

export const PLUGINS2_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'plugins2')

global.plugins2 = global.plugins2 || {}
let sorted = null

function validate(mod) {
  const plugin = mod?.default
  if (typeof plugin !== 'function') throw new Error('لازم export default يكون دالة')
  const cmd = plugin.command
  const ok =
    cmd instanceof RegExp ||
    (typeof cmd === 'string' && cmd.trim()) ||
    (Array.isArray(cmd) && cmd.length)
  if (!ok) throw new Error('لازم plugin.command (نص أو مصفوفة أو RegExp)')
  return plugin
}

export async function loadPlugin2(file) {
  const url =
    pathToFileURL(path.join(PLUGINS2_DIR, file)).href +
    `?t=${Date.now()}-${Math.random().toString(36).slice(2)}`
  const plugin = validate(await import(url))
  global.plugins2[file] = plugin
  if (global.panelDisabled?.has('p2:' + file)) plugin.disabled = true
  sorted = null
  return plugin
}

export function removePlugin2(file) {
  delete global.plugins2[file]
  sorted = null
}

export async function loadPlugins2() {
  fs.mkdirSync(PLUGINS2_DIR, { recursive: true })
  const files = fs.readdirSync(PLUGINS2_DIR).filter(f => f.endsWith('.js'))
  const failed = []
  let ok = 0

  for (const file of files) {
    try {
      await loadPlugin2(file)
      ok++
    } catch (e) {
      failed.push([file, String(e?.message || e).split('\n')[0]])
    }
  }

  console.log(`🛡️ بلوقن 2 (الحماية): تحميل ${ok} من ${files.length}`)
  for (const [file, reason] of failed) console.log(`   ⚠️ ${file}: ${reason}`)
  return { ok, failed }
}

export function listPlugins2() {
  if (!sorted) {
    sorted = Object.entries(global.plugins2).sort(
      ([fa, a], [fb, b]) =>
        (a.priority ?? 10) - (b.priority ?? 10) || fa.localeCompare(fb)
    )
  }
  return sorted
}

// commandText = نص الأمر بعد التطبيع (يبدأ بنقطة). يرجّع مصفوفة الوسائط أو null
export function matchCommand(plugin, commandText) {
  const words = commandText.replace(/^\./, '').trim().split(' ')
  const first = (words[0] || '').toLowerCase()
  const cmd = plugin.command

  if (cmd instanceof RegExp) {
    cmd.lastIndex = 0
    return cmd.test(commandText) ? words.slice(1) : null
  }

  const names = (Array.isArray(cmd) ? cmd : [cmd])
    .filter(v => typeof v === 'string')
    .map(v => v.replace(/^\./, '').trim().toLowerCase())

  return names.includes(first) ? words.slice(1) : null
}

export function findPlugin2(commandText) {
  if (!commandText || !commandText.startsWith('.')) return null
  for (const [file, plugin] of listPlugins2()) {
    if (plugin.disabled) continue
    const args = matchCommand(plugin, commandText)
    if (args) return { file, plugin, args }
  }
  return null
}
