// core/modes.js — هيئة البوت (حماية / أوامر) لكل قروب على حدة
// الملف: data/modes.json  →  { defaults: {...}, chats: { "<jid>@g.us": {...} } }
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'modes.json')

// الافتراضي = نفس وضع البوت قبل التقسيم: حماية شغالة، الأوامر مطفية
const BASE = { protection: true, commands: false }

let cache = null

function load() {
  if (cache) return cache
  let raw = {}
  try {
    raw = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {}

  // ترحيل الصيغة القديمة (هيئة عامة وحدة) إلى الافتراضية
  const legacy = {}
  if (typeof raw.protection === 'boolean') legacy.protection = raw.protection
  if (typeof raw.commands === 'boolean') legacy.commands = raw.commands

  cache = {
    defaults: { ...BASE, ...legacy, ...(raw.defaults || {}) },
    chats: raw.chats && typeof raw.chats === 'object' ? raw.chats : {}
  }
  return cache
}

function save() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(cache, null, 2))
  } catch (e) {
    console.error('[modes] فشل حفظ الهيئة:', e.message)
  }
}

const isGroup = chat => typeof chat === 'string' && chat.endsWith('@g.us')

// الهيئة الفعلية لهذي المحادثة (قروب له هيئة خاصة، وإلا الافتراضية)
// conn محجوز للمرحلة الجاية (هيئة مستقلة لكل رقم مربوط)
export function getModes(conn, chat) {
  const data = load()
  if (isGroup(chat) && data.chats[chat]) return { ...data.defaults, ...data.chats[chat] }
  return { ...data.defaults }
}

export function hasOwnModes(conn, chat) {
  return isGroup(chat) && Boolean(load().chats[chat])
}

// قروب: يغيّر هيئة هذا القروب فقط. خاص: يغيّر الافتراضية.
export function setMode(conn, chat, key, value) {
  const data = load()
  if (isGroup(chat)) {
    data.chats[chat] = { ...getModes(conn, chat), [key]: Boolean(value) }
  } else {
    data.defaults[key] = Boolean(value)
  }
  save()
  return getModes(conn, chat)
}

// يرجّع القروب للهيئة الافتراضية
export function resetChat(conn, chat) {
  const data = load()
  if (isGroup(chat)) {
    delete data.chats[chat]
    save()
  }
  return getModes(conn, chat)
}
