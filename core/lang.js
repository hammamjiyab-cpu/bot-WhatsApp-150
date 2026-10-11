// core/lang.js — one-line language switch for the whole bot (no code changes needed).
// تغيير لغة كل ردود البوت من سطر واحد: BOT_LANG في .env أو global.LANG في settings.js
// أو بالأمر:  .لغة en
//
// How it works: every outgoing text/caption is translated from Arabic (the base language)
// to the chosen language, cached on disk, and sent. Mentions, links and `code` are kept.

import fs from 'fs'
import path from 'path'

const BASE = 'ar'
const DIR = path.join(process.cwd(), 'data')
const LANG_FILE = path.join(DIR, 'lang.json')
const CACHE_FILE = path.join(DIR, 'lang-cache.json')
const FIELDS = ['text', 'caption', 'footer', 'title', 'subtitle']

function normalize(code) {
  const c = String(code || '').trim()
  if (/^zh$/i.test(c)) return 'zh-CN'
  const [a, b] = c.split('-')
  return b ? `${a.toLowerCase()}-${b.toUpperCase()}` : a.toLowerCase()
}

let override = null
try { override = JSON.parse(fs.readFileSync(LANG_FILE, 'utf8')).lang || null } catch {}

export function currentLang() {
  return normalize(override || global.LANG || BASE) || BASE
}

export function setLang(code) {
  if (!/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/.test(String(code || '').trim())) return false
  override = normalize(code)
  try {
    fs.mkdirSync(DIR, { recursive: true })
    fs.writeFileSync(LANG_FILE, JSON.stringify({ lang: override }))
  } catch {}
  return true
}

// ---------- cache ----------
let cache = new Map()
try { cache = new Map(Object.entries(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')))) } catch {}
let saveTimer = null
function saveCacheSoon() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      while (cache.size > 5000) cache.delete(cache.keys().next().value)
      fs.mkdirSync(DIR, { recursive: true })
      fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)))
    } catch {}
  }, 5000)
}

// ---------- translators ----------
let lib // undefined = not tried yet, null = not installed
async function viaLibrary(text, to) {
  if (lib === undefined) {
    try { const m = await import('google-translate-api-x'); lib = m.default || m.translate || m } catch { lib = null }
  }
  if (!lib) return null
  const r = await lib(text, { to })
  return typeof r?.text === 'string' ? r.text : null
}

async function viaEndpoint(text, to) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
    encodeURIComponent(to) + '&dt=t&q=' + encodeURIComponent(text)
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null
  const data = await res.json()
  return (data?.[0] || []).map(x => x?.[0] || '').join('')
}

async function translateChunk(text, to) {
  try { const r = await viaLibrary(text, to); if (r) return r } catch {}
  try { const r = await viaEndpoint(text, to); if (r) return r } catch {}
  return text
}

function protect(text) {
  const keep = []
  const t = text.replace(/(https?:\/\/\S+|@\d{5,}|`[^`\n]*`)/g, m => { keep.push(m); return `XQ${keep.length - 1}QX` })
  return { t, keep }
}
const restore = (t, keep) => t.replace(/XQ\s*(\d+)\s*QX/gi, (_, i) => keep[+i] ?? '')

function chunks(text, max = 1500) {
  const out = []; let cur = ''
  for (const line of text.split('\n')) {
    if ((cur + '\n' + line).length > max && cur) { out.push(cur); cur = line } else cur = cur ? cur + '\n' + line : line
  }
  if (cur) out.push(cur)
  return out
}

export async function translateText(text, to = currentLang()) {
  if (typeof text !== 'string' || !text.trim()) return text
  to = normalize(to)
  if (to === BASE || /^©/.test(text) || !/\p{L}/u.test(text)) return text
  const key = `${to}|${text}`
  if (cache.has(key)) return cache.get(key)
  const { t, keep } = protect(text)
  const parts = []
  for (const c of chunks(t)) parts.push(await translateChunk(c, to))
  const result = restore(parts.join('\n'), keep)
  cache.set(key, result); saveCacheSoon()
  return result
}

async function translateContent(content, to) {
  if (!content || typeof content !== 'object') return content
  const out = { ...content }
  for (const f of FIELDS) if (typeof out[f] === 'string') out[f] = await translateText(out[f], to)
  if (Array.isArray(out.buttons)) {
    out.buttons = await Promise.all(out.buttons.map(async b =>
      b?.buttonText?.displayText
        ? { ...b, buttonText: { ...b.buttonText, displayText: await translateText(b.buttonText.displayText, to) } }
        : b))
  }
  return out
}

// Wrap sock.sendMessage once (called from makeWASocket, so sub-bots get it too)
export function installLanguage(sock) {
  if (!sock || sock.__langInstalled) return sock
  const original = sock.sendMessage.bind(sock)
  sock.sendMessage = async (jid, content, options) => {
    try {
      const to = currentLang()
      if (to !== BASE) content = await translateContent(content, to)
    } catch {}
    return original(jid, content, options)
  }
  sock.__langInstalled = true
  return sock
}
