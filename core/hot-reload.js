// core/hot-reload.js — حلقة المراقبة: أي إضافة/تعديل/حذف في plugins/ و plugins2/ يتطبق فوراً بدون ريستارت
import path from 'path'
import chokidar from 'chokidar'
import { PLUGINS_DIR, loadPlugin, removePlugin } from './plugins-loader.js'
import { PLUGINS2_DIR, loadPlugin2, removePlugin2 } from './plugins2-loader.js'

function watchDir(dir, label, load, remove) {
  const watcher = chokidar.watch(dir, {
    ignoreInitial: true,
    depth: 0,
    // على بعض الاستضافات أحداث الملفات ما تشتغل: شغّل WATCH_POLLING=1
    usePolling: process.env.WATCH_POLLING === '1',
    interval: 1000,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 }
  })

  const onUpsert = kind => async full => {
    const file = path.basename(full)
    if (!file.endsWith('.js')) return
    try {
      const r = await load(file)
      console.log(`🔥 ${label}: ${kind} ${file}${r === null ? ' (ملف مساعد)' : ''}`)
    } catch (e) {
      console.log(`⚠️ ${label}: فشل ${kind} ${file} — ${String(e?.message || e).split('\n')[0]} (بقيت النسخة القديمة)`)
    }
  }

  watcher.on('add', onUpsert('تحميل'))
  watcher.on('change', onUpsert('تحديث'))
  watcher.on('unlink', full => {
    const file = path.basename(full)
    if (!file.endsWith('.js')) return
    remove(file)
    console.log(`🗑️ ${label}: حذف ${file}`)
  })
  watcher.on('error', e => console.log(`⚠️ ${label}: خطأ مراقبة — ${e?.message || e}`))
  return watcher
}

export function startHotReload() {
  if (global.__hotReloadStarted) return // إعادة الاتصال تعيد startBot، لا نكرر المراقبة
  global.__hotReloadStarted = true
  watchDir(PLUGINS_DIR, 'بلوقن 1', loadPlugin, removePlugin)
  watchDir(PLUGINS2_DIR, 'بلوقن 2', loadPlugin2, removePlugin2)
  console.log('🔥 المراقبة التلقائية شغالة (plugins + plugins2)')
}
