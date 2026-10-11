// handler1.js
// ✧ Hammam - هيندر 1: الحماية ✧
// يحتفظ بالحارس (جهات الاتصال) والعدّ وأحداث القروب.
// أوامر الحماية صارت ملفات مستقلة في plugins2/ (بلوقن 2).
// لا يعتمد على Prototype_core أو smsg أو plugins/

import fs from 'fs'
import path from 'path'
import { db } from './firebase.js'
import { forwardConn } from './core/forward.js'
import { findPlugin2 } from './core/plugins2-loader.js'
const DATA_DIR = path.join(process.cwd(), 'data')
const STATS_FILE = path.join(DATA_DIR, 'stats.json')
const ELITE_FILE = path.join(DATA_DIR, 'elite_users.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'handler_state.json')

fs.mkdirSync(DATA_DIR, { recursive: true })

// ──────────────────────────────────────────────
// الحالة
// ──────────────────────────────────────────────

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(file, value) {
  try {
    fs.writeFileSync(file, JSON.stringify(value, null, 2))
  } catch (e) {
    console.error('[Hammam] فشل حفظ البيانات:', e)
  }
}

const eliteArray = readJson(ELITE_FILE, [])
global.eliteUsers = new Set(
  Array.isArray(eliteArray) ? eliteArray : []
)

const savedState = readJson(SETTINGS_FILE, {
  muted: false,
  adminGroup: null
})

global.isMuted = Boolean(savedState.muted)
global.contactWarnings ??= new Map()
global.bannedUsers ??= new Set()

const stats = readJson(STATS_FILE, {
  version: 1,
  groups: {}
})

let firebaseDirtyGroups = new Set()
let firebaseReady = false

// ذاكرة مؤقتة: كل رسالة جديدة تسجل كحدث مستقل هنا.
// يتم تفريغها إلى stats/Firebase كل 5 دقائق.
const pendingMessageEvents = new Map()
const pendingEventCounts = new Map()
const recentActiveAdmins = new Map()
const groupAdminCache = new Map()
const welcomeSent = new Map()

const groupMetaCache = new Map()
const lidCache = new Map()
const noLidMap = new Map()
const guardSeen = new Map()
const seenMessageIds = new Map()
const AUTH_DIR = path.join(process.cwd(), 'session')

// true  = .حسبه و .تفاعل مفتوحين لكل الأعضاء
// false = المطور والنخبة فقط (الباقي البوت ما يرد عليهم)
const OPEN_STATS_FOR_ALL = false

async function loadStatsFromFirebase() {
  try {
    const snap = await db.collection('group_stats').get()

    for (const doc of snap.docs) {
      // إذا كانت النسخة المحلية موجودة، نعتبرها أحدث من آخر مزامنة
      // حتى لا نستبدل الرسائل/المستخدمين الجدد ببيانات Firebase الأقدم.
      if (!stats.groups[doc.id]) {
        stats.groups[doc.id] = doc.data()
      }
    }

    firebaseReady = true
    console.log('🔥 تم تحميل إحصائيات المجموعات من Firebase')
  } catch (e) {
    console.error(
      '[Hammam] تعذر تحميل إحصائيات Firebase:',
      e?.message || e
    )
  }
}

// ⚡ النخبة وحالة التشغيل كانت محلية بس (ملفات JSON على قرص KataBump) —
// لو الحاوية انعاد تشغيلها/نشرها من جديد، القرص المحلي ممكن يُصفَّر ونخسر البيانات.
// نضيف نفس نمط مزامنة الإحصائيات هنا عشان تصير محفوظة بشكل دائم فعليًا.
async function loadEliteFromFirebase() {
  try {
    const doc = await db.collection('bot_settings').doc('elite_users').get()
    if (doc.exists) {
      const remote = doc.data()?.numbers || []
      // ندمج بدل ما نستبدل، حتى لو تغيّرت القائمة محليًا بين مزامنتين
      for (const num of remote) global.eliteUsers.add(num)
      saveElite()
    }
  } catch (e) {
    console.error('[Hammam] تعذر تحميل قائمة النخبة من Firebase:', e?.message || e)
  }
}

async function loadStateFromFirebase() {
  try {
    const doc = await db.collection('bot_settings').doc('state').get()
    if (doc.exists) {
      const remote = doc.data() || {}
      if (typeof remote.muted === 'boolean') global.isMuted = remote.muted
      if (remote.adminGroup) savedState.adminGroup = remote.adminGroup
    }
  } catch (e) {
    console.error('[Hammam] تعذر تحميل حالة البوت من Firebase:', e?.message || e)
  }
}

async function syncStatsToFirebase() {
  if (!firebaseReady || !firebaseDirtyGroups.size) return

  const ids = [...firebaseDirtyGroups]
  firebaseDirtyGroups.clear()

  try {
    for (let i = 0; i < ids.length; i += 400) {
      const batch = db.batch()
      const chunk = ids.slice(i, i + 400)

      for (const groupId of chunk) {
        const group = stats.groups[groupId]
        if (!group) continue

        const ref = db.collection('group_stats').doc(groupId)

        batch.set(
          ref,
          group,
          { merge: true }
        )
      }

      await batch.commit()
    }
  } catch (e) {
    for (const id of ids) {
      firebaseDirtyGroups.add(id)
    }

    console.error(
      '[Hammam] فشل مزامنة Firebase:',
      e?.message || e
    )
  }
}

const firebaseLoadPromise = Promise.all([
  loadStatsFromFirebase(),
  loadEliteFromFirebase(),
  loadStateFromFirebase()
])

// لا نكتب على القرص مع كل رسالة.
// الرسائل تبقى في الذاكرة المؤقتة، ثم تُدمج في البيانات كل 5 دقائق.
let statsDirty = false
let statsFlushTimer = null

function queueMessageEvent(groupId, sender, day, hour, timestamp = Date.now()) {
  if (!pendingMessageEvents.has(groupId)) {
    pendingMessageEvents.set(groupId, [])
  }

  pendingMessageEvents.get(groupId).push({
    sender,
    day,
    hour,
    timestamp
  })

  pendingEventCounts.set(
    groupId,
    (pendingEventCounts.get(groupId) || 0) + 1
  )
}

function getPendingEvents(groupId) {
  return pendingMessageEvents.get(groupId) || []
}

function flushPendingMessageEvents() {
  if (!pendingMessageEvents.size) return

  for (const [groupId, events] of pendingMessageEvents) {
    const group = ensureGroupStats(groupId)

    for (const event of events) {
      group.totalMessages += 1

      group.activeUsers[event.sender] =
        (group.activeUsers[event.sender] || 0) + 1

      if (!group.dailyUsers) group.dailyUsers = {}
      if (!group.dailyUsers[event.day]) group.dailyUsers[event.day] = {}
      group.dailyUsers[event.day][event.sender] =
        (group.dailyUsers[event.day][event.sender] || 0) + 1

      group.daily[event.day] =
        (group.daily[event.day] || 0) + 1

      group.hourly[event.hour] =
        (group.hourly[event.hour] || 0) + 1

      group.updatedAt = event.timestamp
    }

    firebaseDirtyGroups.add(groupId)
  }

  pendingMessageEvents.clear()
  pendingEventCounts.clear()
  statsDirty = true
}

function saveElite() {
  writeJson(
    ELITE_FILE,
    [...global.eliteUsers]
  )

  db.collection('bot_settings').doc('elite_users')
    .set({ numbers: [...global.eliteUsers], updatedAt: Date.now() })
    .catch(e => console.error('[Hammam] فشل مزامنة النخبة مع Firebase:', e?.message || e))
}

function saveState() {
  const state = {
    muted: Boolean(global.isMuted),
    adminGroup: savedState.adminGroup || null
  }

  writeJson(SETTINGS_FILE, state)

  db.collection('bot_settings').doc('state')
    .set({ ...state, updatedAt: Date.now() })
    .catch(e => console.error('[Hammam] فشل مزامنة الحالة مع Firebase:', e?.message || e))
}

function scheduleStatsSave(groupId = null) {
  statsDirty = true

  if (groupId) {
    firebaseDirtyGroups.add(groupId)
  }

  // الحفظ الفعلي يتم في دورة الـ5 دقائق.
}


// تأخير بسيط (ثانيتين) يُستخدم قبل أي خطوة/رد عدا حارس جهة الاتصال
// (حارس جهة الاتصال يجب أن يبقى فوريًا بدون تأخير).
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────────
// أدوات JID
// ──────────────────────────────────────────────

function numberFromJid(jid = '') {
  return String(jid)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '')
}

function normalizeJid(jid = '') {
  const value = String(jid || '')

  if (value.endsWith('@s.whatsapp.net')) {
    const n = numberFromJid(value)
    return n ? `${n}@s.whatsapp.net` : value
  }

  if (value.endsWith('@lid')) {
    const n = numberFromJid(value)
    return n ? `${n}@lid` : value
  }

  if (value.includes('@')) return value

  const number = numberFromJid(value)
  return number ? `${number}@s.whatsapp.net` : value
}

// كاش بيانات القروب (يقلل طلبات groupMetadata)
async function getGroupMeta(conn, groupId, force = false) {
  if (!groupId?.endsWith('@g.us')) return null

  const cached = groupMetaCache.get(groupId)
  if (!force && cached && Date.now() - cached.at < 2 * 60 * 1000) {
    return cached.meta
  }

  try {
    const meta = await conn.groupMetadata(groupId)
    groupMetaCache.set(groupId, { meta, at: Date.now() })
    return meta
  } catch {
    return cached?.meta || null
  }
}

function participantJidOf(p) {
  if (!p) return ''

  if (typeof p === 'string') {
    if (p.startsWith('{')) {
      try {
        const o = JSON.parse(p)
        return o.phoneNumber || o.id || ''
      } catch {}
    }
    return p
  }

  return p.phoneNumber || p.id || ''
}

// LID -> رقم حقيقي من ملفات الجلسة (بدون شبكة)
function lidNumberToPnFromFiles(lidNumber) {
  try {
    const file = path.join(AUTH_DIR, `lid-mapping-${lidNumber}_reverse.json`)
    if (!fs.existsSync(file)) return null
    const value = JSON.parse(fs.readFileSync(file, 'utf8'))
    const pn = String(value || '').replace(/\D/g, '')
    return pn || null
  } catch {
    return null
  }
}

// رقم موحّد (متزامن): إذا كان الرقم معرّف LID معروف يرجّع الرقم الحقيقي
function canonNumber(value = '') {
  const num = numberFromJid(value)
  if (!num) return ''

  const hit = lidCache.get(num)
  if (hit) return hit

  const neg = noLidMap.get(num)
  if (neg && Date.now() - neg < 10 * 60 * 1000) return num

  const fromFile = lidNumberToPnFromFiles(num)
  if (fromFile) {
    lidCache.set(num, fromFile)
    return fromFile
  }

  noLidMap.set(num, Date.now())
  return num
}

async function lidToPn(conn, jid, groupId = '') {
  const lidNum = numberFromJid(jid)
  if (!lidNum) return null

  const known = lidCache.get(lidNum) || lidNumberToPnFromFiles(lidNum)
  if (known) {
    lidCache.set(lidNum, known)
    return known
  }

  // 1) مخزن التعيينات حق Baileys
  try {
    const r = await conn.signalRepository?.lidMapping?.getPNForLID?.(`${lidNum}@lid`)
    const n = r ? numberFromJid(r) : ''
    if (n) {
      lidCache.set(lidNum, n)
      return n
    }
  } catch {}

  // 2) بيانات القروب
  const meta = await getGroupMeta(conn, groupId)
  const p = (meta?.participants || []).find(x =>
    numberFromJid(x?.id) === lidNum || numberFromJid(x?.lid) === lidNum
  )
  const alt =
    p?.phoneNumber ||
    p?.jid ||
    (String(p?.id || '').endsWith('@s.whatsapp.net') ? p.id : '')
  const n2 = alt ? numberFromJid(alt) : ''
  if (n2) {
    lidCache.set(lidNum, n2)
    return n2
  }

  // 3) دالة قديمة إن كانت محمّلة
  try {
    if (typeof conn.convertLidToRealJid === 'function') {
      const r = await conn.convertLidToRealJid(`${lidNum}@lid`, groupId)
      const n3 = r && !String(r).endsWith('@lid') ? numberFromJid(r) : ''
      if (n3 && n3 !== lidNum) {
        lidCache.set(lidNum, n3)
        return n3
      }
    }
  } catch {}

  return null
}

// تحويل LID إلى JID الحقيقي قبل أي حفظ/منشن/استخراج رقم
async function resolveRealJid(conn, jid, groupId = '') {
  if (!jid) return jid
  if (typeof jid === 'object') jid = participantJidOf(jid)

  jid = String(jid)

  if (!jid.endsWith('@lid')) {
    return jid.endsWith('@s.whatsapp.net') ? normalizeJid(jid) : jid
  }

  const pn = await lidToPn(conn, jid, groupId)
  return pn ? `${pn}@s.whatsapp.net` : normalizeJid(jid)
}

async function resolveRealJids(conn, jids, groupId = '') {
  const unique = [...new Set((jids || []).filter(Boolean))]
  const out = []

  for (const jid of unique) {
    out.push(await resolveRealJid(conn, jid, groupId))
  }

  return out
}

// مرسل الرسالة (يفضّل الرقم الحقيقي اللي يجي مع الرسالة)
async function resolveSender(conn, message) {
  const key = message?.key || {}
  const chat = key.remoteJid || ''
  const isGroup = chat.endsWith('@g.us')

  const raw = isGroup ? (key.participant || '') : chat
  const alt = isGroup
    ? (key.participantAlt || key.participantPn)
    : (key.remoteJidAlt || key.senderPn)

  if (alt && String(alt).endsWith('@s.whatsapp.net')) {
    return normalizeJid(alt)
  }

  return resolveRealJid(conn, raw, chat)
}

// الهدف: منشن ثم رد على رسالة ثم رقم مكتوب
async function getTargetJid(conn, message, text, chat) {
  const content = unwrapMessage(message?.message)
  const ctx = Object.values(content).find(
    v => v && typeof v === 'object' && v.contextInfo
  )?.contextInfo

  let target = ctx?.mentionedJid?.[0] || ctx?.participant || ''

  if (!target) {
    const digits = String(text || '').replace(/\D/g, '')
    if (digits.length >= 8 && digits.length <= 15) {
      target = `${digits}@s.whatsapp.net`
    }
  }

  if (!target) return null
  return resolveRealJid(conn, target, chat)
}

// يرجع معرّف العضو كما هو داخل القروب (لأوامر الرفع/السحب)
async function findGroupMember(conn, chat, targetJid) {
  const wanted = new Set([
    numberFromJid(targetJid),
    canonNumber(targetJid)
  ].filter(Boolean))

  const meta = await getGroupMeta(conn, chat, true)

  for (const p of meta?.participants || []) {
    const fields = [p?.id, p?.lid, p?.phoneNumber, p?.jid].filter(Boolean)
    const hit = fields.some(f =>
      wanted.has(numberFromJid(f)) || wanted.has(canonNumber(f))
    )
    if (hit) return p
  }

  return null
}

// ──────────────────────────────────────────────
// استخراج الرسالة
// ──────────────────────────────────────────────

function unwrapMessage(message) {
  let current = message

  while (current) {
    if (current.ephemeralMessage?.message) {
      current =
        current.ephemeralMessage.message
      continue
    }

    if (current.viewOnceMessage?.message) {
      current =
        current.viewOnceMessage.message
      continue
    }

    if (current.viewOnceMessageV2?.message) {
      current =
        current.viewOnceMessageV2.message
      continue
    }

    if (
      current.viewOnceMessageV2Extension?.message
    ) {
      current =
        current.viewOnceMessageV2Extension.message
      continue
    }

    if (
      current.documentWithCaptionMessage?.message
    ) {
      current =
        current.documentWithCaptionMessage.message
      continue
    }

    if (current.editedMessage?.message) {
      current =
        current.editedMessage.message
      continue
    }

    if (current.deviceSentMessage?.message) {
      current =
        current.deviceSentMessage.message
      continue
    }

    break
  }

  return current || {}
}

function getMessageType(message) {
  const content =
    unwrapMessage(message?.message)

  return Object.keys(content)[0] || ''
}

// واتساب (خصوصًا مع الشرطة السفلية "_" وسط نص عربي) يضيف أحيانًا
// محارف اتجاه غير مرئية (RLM/LRM وغيرها) داخل النص المكتوب فعليًا،
// فتفشل مطابقة الأوامر بالـ === أو startsWith رغم إن النص يبين متطابق
// بالعين. هذي الدالة تشيل هالمحارف قبل أي مطابقة أوامر.
function stripInvisibleChars(text) {
  return text.replace(
    /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g,
    ''
  )
}

function getText(message) {
  const content = unwrapMessage(message?.message) || {}

  const normalText =
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption

  if (normalText) return normalText

  const buttonId =
    content.buttonsResponseMessage?.selectedButtonId ||
    content.templateButtonReplyMessage?.selectedId ||
    content.listResponseMessage?.singleSelectReply?.selectedRowId

  if (buttonId) return buttonId

  const paramsJson =
    content.interactiveResponseMessage
      ?.nativeFlowResponseMessage?.paramsJson

  if (paramsJson) {
    try {
      const data = JSON.parse(paramsJson)
      return (
        data.id ||
        data.selected_id ||
        data.selectedId ||
        data.row_id ||
        data.button_id ||
        ''
      )
    } catch {}
  }

  return ''
}

// ──────────────────────────────────────────────
// 🛡️ حارس جهات الاتصال
// ──────────────────────────────────────────────

function isContactMessage(message) {
  const type =
    getMessageType(message)

  return (
    type === 'contactMessage' ||
    type === 'contactsArrayMessage'
  )
}

async function getRecentActiveAdmins(conn, chat) {
  const cached = recentActiveAdmins.get(chat) || []
  return cached.slice(-5)
}

async function refreshGroupAdmins(conn, chat, force = false) {
  const cached = groupAdminCache.get(chat)
  if (
    !force &&
    cached &&
    Date.now() - cached.updatedAt < 10 * 60 * 1000
  ) {
    return cached.admins
  }

  try {
    const metadata = await getGroupMeta(conn, chat)
    const rawAdmins = (metadata?.participants || [])
      .filter(p => p?.admin === 'admin' || p?.admin === 'superadmin')
      .map(p => p.id)

    const admins = new Set(
      await resolveRealJids(conn, rawAdmins, chat)
    )

    groupAdminCache.set(chat, {
      admins,
      updatedAt: Date.now()
    })

    return admins
  } catch {
    return cached?.admins || new Set()
  }
}

async function rememberActiveSender(conn, chat, sender) {
  if (!chat?.endsWith('@g.us') || !sender) return

  const admins = await refreshGroupAdmins(conn, chat)
  const realSender = await resolveRealJid(conn, sender, chat)

  if (!admins.has(realSender)) return

  const list = recentActiveAdmins.get(chat) || []
  const next = list.filter(jid => jid !== realSender)
  next.push(realSender)

  recentActiveAdmins.set(chat, next.slice(-5))
}

async function contactGuard(conn, message) {
  const chat =
    message?.key?.remoteJid

  if (!chat?.endsWith('@g.us')) return false
  if (!isContactMessage(message)) return false

  const sender =
    message.key?.participant ||
    message.key?.remoteJid

  // هذا هو الأسلوب الذي كان يعمل عندك:
  // نحاول الحذف والقفل مباشرة بدون فحص admin مسبق.
  // فحص admin المضاف لاحقًا كان سبب رسالة "البوت ليس مشرفًا" رغم أنه مشرف.
  const deletePromise = conn.sendMessage(chat, {
    delete: message.key
  }).catch(() => {})

  const lockPromise = conn.groupSettingUpdate(
    chat,
    'announcement'
  ).catch(() => {})

  await Promise.allSettled([
    deletePromise,
    lockPromise
  ])

  const cleanSender = await resolveRealJid(
    conn,
    sender,
    chat
  )

  const warnings =
    global.contactWarnings instanceof Map
      ? global.contactWarnings
      : new Map()

  const key =
    `${chat}:${cleanSender || sender}`

  const count =
    (warnings.get(key) || 0) + 1

  warnings.set(key, count)
  global.contactWarnings = warnings

  const senderNumber =
    numberFromJid(cleanSender || sender)

  const recentAdmins =
    await getRecentActiveAdmins(conn, chat)

  const adminMentions =
    recentAdmins.filter(
      jid => jid && jid !== cleanSender
    )

  const adminText =
    adminMentions.length
      ? `\n👮 *آخر المشرفين المتصلين:* ${adminMentions.map(jid => `@${numberFromJid(jid)}`).join(' ، ')}`
      : ''

  await conn.sendMessage(chat, {
    text:
      `🚨 *حارس جهات الاتصال*\n\n` +
      `👤 المرسل: @${senderNumber}\n` +
      `🗑️ تم حذف رسالة جهة الاتصال.\n` +
      `🔒 تم قفل المجموعة.\n` +
      `⚠️ رقم التحذير: ${count}` +
      adminText,
    mentions: [
      cleanSender || sender,
      ...adminMentions
    ].filter(Boolean)
  }).catch(() => {})

  return true
}

// ──────────────────────────────────────────────
// 📊 الإحصائيات
// ──────────────────────────────────────────────

function riyadhParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }
  ).formatToParts(date)

  return Object.fromEntries(
    parts.map(x => [x.type, x.value])
  )
}

function todayKey(date = new Date()) {
  const parts = riyadhParts(date)
  return `${parts.year}-${parts.month}-${parts.day}`
}

function hourKey(date = new Date()) {
  return String(
    Number(riyadhParts(date).hour) % 24
  ).padStart(2, '0')
}

function riyadhNowText(date = new Date()) {
  const p = riyadhParts(date)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
}

function ensureGroupStats(groupId) {
  if (!stats.groups[groupId]) {
    stats.groups[groupId] = {
      totalMessages: 0,
      activeUsers: {},
      dailyUsers: {},
      daily: {},
      hourly: {},
      joins: 0,
      leaves: 0,
      dailyJoins: {},
      dailyLeaves: {},
      updatedAt: Date.now()
    }
  }

  const g = stats.groups[groupId]
  g.activeUsers ??= {}
  g.dailyUsers ??= {}
  g.daily ??= {}
  g.hourly ??= {}
  g.dailyJoins ??= {}
  g.dailyLeaves ??= {}
  g.joins ??= 0
  g.leaves ??= 0
  g.totalMessages ??= 0

  return g
}

// وقت الرسالة الفعلي (ثواني واتساب) بدل وقت وصولها للبوت
function messageDate(message) {
  let ts = message?.messageTimestamp

  if (ts && typeof ts === 'object') {
    ts = typeof ts.toNumber === 'function'
      ? ts.toNumber()
      : Number(ts.low)
  }

  ts = Number(ts) * 1000
  const now = Date.now()

  if (!ts || ts > now + 5 * 60 * 1000) return new Date(now)
  return new Date(ts)
}

async function recordMessage(conn, message, senderJid = null) {
  const chat =
    message?.key?.remoteJid

  if (!chat?.endsWith('@g.us')) {
    return
  }

  // منع العد المكرر لنفس الرسالة
  const id = message.key?.id
  if (id) {
    const k = `${chat}:${id}`
    if (seenMessageIds.has(k)) return
    seenMessageIds.set(k, Date.now())

    if (seenMessageIds.size > 5000) {
      for (const old of seenMessageIds.keys()) {
        if (seenMessageIds.size <= 2500) break
        seenMessageIds.delete(old)
      }
    }
  }

  const sender = senderJid || await resolveSender(conn, message)
  if (!sender) return

  const when = messageDate(message)

  queueMessageEvent(
    chat,
    normalizeJid(sender),
    todayKey(when),
    hourKey(when),
    when.getTime()
  )
}


// ──────────────────────────────────────────────
// صلاحيات
// ──────────────────────────────────────────────

function ownerNumbers() {
  return new Set(
    (global.owner || [])
      .map(numberFromJid)
  )
}

function collectOwnerNumbers() {
  const values = [
    ...(Array.isArray(global.owner) ? global.owner : []),
    ...(Array.isArray(global.owners) ? global.owners : []),
    global.ownerNumber,
    global.ownerJid,
    global.botOwner,
    global.botOwnerNumber
  ].filter(Boolean)

  const numbers = new Set()
  for (const value of values) {
    const list = Array.isArray(value) ? value : [value]
    for (const item of list) {
      const n = numberFromJid(item)
      if (n) numbers.add(n)
    }
  }
  return numbers
}

async function isOwner(conn, jid, groupId = '') {
  const realJid = await resolveRealJid(conn, jid, groupId)
  const num = numberFromJid(realJid)
  return collectOwnerNumbers().has(num) || !!conn?.sub?.owners?.has(num)
}

async function isElite(conn, jid, groupId = '') {
  const realJid = await resolveRealJid(
    conn,
    jid,
    groupId
  )

  const number = canonNumber(realJid)
  if (!number) return false

  return [...global.eliteUsers].some(saved =>
    canonNumber(saved) === number
  )
}

function removeEliteIdentity(jid) {
  const number = canonNumber(jid)

  for (const saved of [...global.eliteUsers]) {
    if (canonNumber(saved) === number) {
      global.eliteUsers.delete(saved)
    }
  }
}

// ──────────────────────────────────────────────
// .حسبه
// ──────────────────────────────────────────────

function formatCount(value) {
  const n = Number(value || 0)

  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}m`
  }

  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }

  return String(n)
}

// عدّاد اليوم (بتوقيت الرياض) لكل عضو، مدموجًا بالرقم الحقيقي
function dailyCounts(chat, day = todayKey()) {
  const group = ensureGroupStats(chat)
  const counts = new Map()

  const add = (jid, n) => {
    const c = canonNumber(jid)
    if (!c) return
    counts.set(c, (counts.get(c) || 0) + n)
  }

  for (const [jid, n] of Object.entries(group.dailyUsers?.[day] || {})) {
    add(jid, Number(n) || 0)
  }

  // الرسائل في الذاكرة المؤقتة ولم تُحفظ بعد
  for (const event of getPendingEvents(chat)) {
    if (event.day === day && event.sender) add(event.sender, 1)
  }

  return counts
}

function getTodayStats(chat) {
  const group = ensureGroupStats(chat)
  const day = todayKey()

  const pendingToday = getPendingEvents(chat)
    .filter(event => event.day === day)
    .length

  const dailyMessages =
    Number(group.daily?.[day] || 0) + pendingToday

  const ACTIVE_THRESHOLD = 200
  const counts = dailyCounts(chat, day)

  const activeUsersOver200 = [...counts.values()]
    .filter(count => Number(count) > ACTIVE_THRESHOLD)
    .length

  const activeUsersAny = [...counts.values()]
    .filter(count => Number(count) > 0)
    .length

  return {
    dailyMessages,
    totalMessages:
      Number(group.totalMessages || 0) +
      getPendingEvents(chat).length,
    activeUsersOver200,
    activeUsersAny
  }
}

async function sendStats(conn, chat) {
  const group = ensureGroupStats(chat)
  const values = getTodayStats(chat)

  // اسم القروب (بدون تخزين/كاش، يجلب من الميتاداتا مباشرة)
  let groupName = chat
  try {
    const metadata = await conn.groupMetadata(chat)
    groupName = metadata?.subject || chat
  } catch {}

  const text =
    `*${groupName}*\n\n` +
    `*التفاعل* ꧁ ${formatCount(values.dailyMessages)} ꧂\n\n` +
    `+𝟮𝟬𝟬  ☜ *عدد المتفاعلين* ✯〘${formatCount(values.activeUsersOver200)}〙✯\n\n` +
    `📋 *عدد المتفاعلين (احصاء كامل)* ✯〘${formatCount(values.activeUsersAny)}〙✯`

  group.updatedAt = Date.now()
  scheduleStatsSave(chat)

  await conn.sendMessage(chat, { text })
}


// ──────────────────────────────────────────────
// 👻 الميتين
// ──────────────────────────────────────────────

async function sendInactive(conn, chat) {
  const metadata = await getGroupMeta(conn, chat, true)

  if (!metadata) {
    await conn.sendMessage(chat, {
      text:
        '❌ تعذر الحصول على بيانات المجموعة.'
    })

    return
  }

  // المتفاعلين اليوم فقط (توقيت الرياض)، مو التراكمي
  const active = new Set(dailyCounts(chat).keys())

  const botNumbers = new Set([
    numberFromJid(conn.user?.id),
    numberFromJid(conn.user?.lid)
  ].filter(Boolean))

  const members = await resolveRealJids(
    conn,
    (metadata.participants || []).map(p => p.phoneNumber || p.id),
    chat
  )

  const inactive = members.filter(jid => {
    const n = canonNumber(jid)
    return n && !active.has(n) && !botNumbers.has(n)
  })

  if (!inactive.length) {
    await conn.sendMessage(chat, {
      text:
        '🎉 لا يوجد أعضاء غير متفاعلين اليوم.'
    })

    return
  }

  const shown = inactive.slice(0, 100)

  let text =
    `👻 *غير المتفاعلين اليوم: ${inactive.length}*\n\n`

  shown.forEach((jid, index) => {
    text += `${index + 1}. @${canonNumber(jid)}\n`
  })

  if (inactive.length > 100) {
    text += `\n⚠️ تم عرض أول 100 فقط.`
  }

  await conn.sendMessage(chat, {
    text,
    mentions: shown
  })
}

// ──────────────────────────────────────────────
// المعالج الرئيسي
// ──────────────────────────────────────────────

async function sendChunked(conn, chat, header, lines, size = 100) {
  for (let i = 0; i < lines.length; i += size) {
    const part = lines.slice(i, i + size).join('\n')
    await conn.sendMessage(chat, {
      text: (i === 0 ? `${header}\n\n` : '') + part
    })
  }
}

async function processMessage(conn, message) {
  if (!message?.message) return
  if (message.key?.fromMe) return

  const chat = message.key?.remoteJid || ''

  if (
    !chat ||
    chat === 'status@broadcast' ||
    chat.endsWith('@broadcast') ||
    chat.endsWith('@newsletter')
  ) {
    return
  }

  const isGroup = chat.endsWith('@g.us')
  const sender = await resolveSender(conn, message)

  if (isGroup) {
    await rememberActiveSender(conn, chat, sender)
  }

  // الحارس يجب أن يسبق الأوامر وأي معالجة أخرى
  if (await contactGuard(conn, message)) return

  // العدّ فوري وبدون تأخير (التأخير يسبب تراكم الرسائل وعدّ غير دقيق)
  await recordMessage(conn, message, sender)

  const text =
    stripInvisibleChars(
      getText(message).trim()
    )

  if (!text || !text.startsWith('.')) return

  // نسخة مطبّعة فقط للمطابقة: نشيل الشرطة السفلية ونوحّد المسافات
  const commandText =
    text
      .replace(/_+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const owner = await isOwner(conn, sender, chat)
  const elite = owner || await isElite(conn, sender, chat)

  // ─────────── الأوامر: كل أمر ملف مستقل في plugins2/ ───────────
  const hit = findPlugin2(commandText)
  if (!hit) return

  const { plugin, file, args } = hit
  if (conn?.sub?.dis?.has('p2:' + file)) return

  // أي شخص غير مطور/نخبة: البوت ما يرد عليه نهائيًا (إلا الأوامر المفتوحة لو OPEN_STATS_FOR_ALL)
  const level = plugin.access || 'elite'
  const open = OPEN_STATS_FOR_ALL && plugin.open === true

  if (level !== 'all' && !owner && !elite && !open) return
  if (global.isMuted && !owner && !elite) return
  if (level === 'owner' && !owner) return

  if (plugin.group && !isGroup) {
    await conn.sendMessage(chat, { text: '⚠️ الأمر يعمل داخل المجموعات فقط.' })
    return
  }

  // كل ردود أوامر الحماية تطلع "معاد توجيهها من القناة"
  const fconn = forwardConn(conn)
  const send = (t, mentions = []) => fconn.sendMessage(chat, { text: t, mentions })

  try {
    await plugin({
      conn: fconn,
      rawConn: conn,
      message,
      chat,
      sender,
      isGroup,
      owner,
      elite,
      commandText,
      args,
      text: args.join(' '),
      file,
      send,
      h: pluginHelpers
    })
  } catch (e) {
    console.error(`❌ [plugins2/${file}]`, e)
    try {
      await send('❌ صار خطأ أثناء تنفيذ الأمر.')
    } catch {}
  }
}

export async function handler(update) {
  const conn = this
  global.__Hammam_CONN__ = conn
  global.conn = conn

  // لا نعالج الرسائل قبل اكتمال تحميل Firebase حتى لا نكتب فوق بيانات قديمة
  try {
    await firebaseLoadPromise
  } catch {}

  await sendDeveloperWarning(conn)

  // رسائل التاريخ/المزامنة (append) تضخّم العدّاد عند إعادة الاتصال
  if (update?.type && update.type !== 'notify') {
    return
  }

  if (!update?.messages?.length) {
    return
  }

  for (const message of update.messages) {
    try {
      await processMessage(conn, message)
    } catch (e) {
      console.error('[Hammam] خطأ أثناء معالجة رسالة:', e?.message || e)
    }
  }
}

// ──────────────────────────────────────────────
// أحداث إضافية — محفوظة للتوسعة
// ──────────────────────────────────────────────

// 🛡️ حارس القروب: تنبيه المطور عند إضافة عضو / رفع أو سحب إشراف
async function guardAlert(conn, groupId, action, actorNumber, targets) {
  const owners = [...collectOwnerNumbers()]
  if (!owners.length) return

  const botNumbers = new Set([
    numberFromJid(conn.user?.id),
    numberFromJid(conn.user?.lid)
  ].filter(Boolean))

  // إجراءات البوت نفسه أو المطور لا تحتاج تنبيه
  if (actorNumber && (botNumbers.has(actorNumber) || owners.includes(actorNumber))) {
    return
  }

  const targetNumbers = [...new Set(targets.map(canonNumber).filter(Boolean))]

  if (action === 'add') {
    // بدون فاعل = دخل بالرابط، أو أضاف نفسه
    if (!actorNumber) return
    if (!targetNumbers.some(n => n !== actorNumber)) return
  }

  if (!targetNumbers.length) return

  // منع التكرار لنفس الحدث
  const dedupeKey = `${groupId}:${action}:${actorNumber}:${targetNumbers.sort().join(',')}`
  const now = Date.now()
  if (now - Number(guardSeen.get(dedupeKey) || 0) < 15_000) return
  guardSeen.set(dedupeKey, now)

  const meta = await getGroupMeta(conn, groupId, true)
  const groupName = meta?.subject || groupId
  const devNumber = owners[0]
  const devJid = `${devNumber}@s.whatsapp.net`

  const title = {
    add: '➕ *تمت إضافة عضو*',
    promote: '⬆️ *تم رفع إشراف*',
    demote: '⬇️ *تم سحب إشراف*'
  }[action]

  const build = mention => {
    const who = actorNumber ? mention(actorNumber) : 'غير معروف'
    return (
      `🛡️ *حارس القروب*\n\n` +
      `${title}\n` +
      `📛 *القروب:* ${groupName}\n` +
      `👤 *بواسطة:* ${who}\n` +
      `🎯 *العضو:* ${targetNumbers.map(mention).join(' ، ')}\n` +
      `🕒 ${riyadhNowText()} (الرياض)\n\n` +
      `🔔 المطور: ${mention(devNumber)}`
    )
  }

  const mentions = new Set([devJid])
  const groupText = build(n => {
    mentions.add(`${n}@s.whatsapp.net`)
    return `@${n}`
  })

  const sent = await conn.sendMessage(groupId, {
    text: groupText,
    mentions: [...mentions]
  }).catch(() => null)

  // إعادة توجيه التنبيه للمطور في الخاص
  try {
    if (!sent) throw new Error('no-sent-message')
    await conn.sendMessage(devJid, { forward: sent })
  } catch {
    await conn.sendMessage(devJid, {
      text: build(n => `+${n}`)
    }).catch(() => {})
  }
}

export async function participantsUpdate(update) {
  const conn = this || global.conn || global.__Hammam_CONN__
  if (conn) {
    global.__Hammam_CONN__ = conn
    global.conn = conn
  }

  const id = update?.id
  const action = update?.action
  if (!id || !action) return

  const group = ensureGroupStats(id)

  // تغيّرت العضوية/الصلاحيات: نلغي الكاش
  groupMetaCache.delete(id)
  groupAdminCache.delete(id)

  const rawParticipants = (Array.isArray(update.participants) ? update.participants : [])
    .map(participantJidOf)
    .filter(Boolean)

  const participants = conn
    ? await resolveRealJids(conn, rawParticipants, id)
    : rawParticipants

  // الفاعل (اللي أضاف/رفع/سحب)
  const actorRaw =
    participantJidOf(update.authorPn) ||
    participantJidOf(update.author)

  const actorJid = actorRaw && conn
    ? await resolveRealJid(conn, actorRaw, id)
    : ''

  const actorNumber = actorJid ? canonNumber(actorJid) : ''

  const day = todayKey()

  if (action === 'add') {
    if (!participants.length) return

    group.joins += participants.length
    group.dailyJoins[day] = Number(group.dailyJoins[day] || 0) + participants.length
    scheduleStatsSave(id)
  }

  if (action === 'remove') {
    group.leaves += participants.length
    group.dailyLeaves[day] = Number(group.dailyLeaves[day] || 0) + participants.length
    scheduleStatsSave(id)
  }

  if (!conn?.sendMessage) {
    console.log(
      '[Hammam] conn غير متوفر أو بدون sendMessage.'
    )
    return
  }

  // 🛡️ الحارس
  if (action === 'add' || action === 'promote' || action === 'demote') {
    try {
      await guardAlert(conn, id, action, actorNumber, participants)
    } catch (e) {
      console.error('[Hammam] خطأ بالحارس:', e?.message || e)
    }
  }

  if (action !== 'add') return

  for (const mentionJid of participants) {
    const jid = String(mentionJid || '')
    if (!jid) continue

    const welcomeKey = `${id}:${canonNumber(jid)}`
    const now = Date.now()
    if (now - Number(welcomeSent.get(welcomeKey) || 0) < 60_000) continue
    welcomeSent.set(welcomeKey, now)

    const number = canonNumber(jid)
    const mentionTarget = `${number}@s.whatsapp.net`

    const welcomeText =
      `🌷 *يا هلا ومرحبا بك* @${number} 🤍\n\n` +
      `✨ نورت القروب، سعداء بانضمامك معنا ونتمنى لك وقتًا جميلًا ومفيدًا.\n\n` +
      `📌 الرجاء الدخول للقروبات الموجودة في الوصف: *قروب الإعلانات والمتجر والبنك*، ويرجى احترام القوانين والتعاون مع الجميع.\n\n` +
      `🌟 حياك الله بين إخوانك وأخواتك.`

    try {
      await conn.sendMessage(id, {
        text: welcomeText,
        mentions: [mentionTarget]
      })
    } catch {}
  }
}

// ──────────────────────────────────────────────
// 🛂 حارس طلبات الانضمام
// ──────────────────────────────────────────────

// رقم/أرقام "الأدميرال" اللي يُمنشن إذا شك المشرف في الرقم أو الصورة.
// اتركها فاضية = يمنشن المطور (global.owner).
const ADMIRAL_NUMBERS = []

const ARAB_REGIONS = [
  'SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'YE', 'IQ', 'SY', 'JO', 'LB',
  'PS', 'EG', 'SD', 'LY', 'TN', 'DZ', 'MA', 'MR', 'SO', 'DJ', 'KM'
]

// احتياط لو مكتبة google-libphonenumber مو متوفرة: مفاتيح الدول العربية فقط
const ARAB_CALLING_CODES = {
  966: 'SA', 971: 'AE', 965: 'KW', 974: 'QA', 973: 'BH', 968: 'OM',
  967: 'YE', 964: 'IQ', 963: 'SY', 962: 'JO', 961: 'LB', 970: 'PS',
  20: 'EG', 249: 'SD', 218: 'LY', 216: 'TN', 213: 'DZ', 212: 'MA',
  222: 'MR', 252: 'SO', 253: 'DJ', 269: 'KM'
}

let phoneUtil = null
try {
  const mod = await import('google-libphonenumber')
  const lib = mod.default || mod
  phoneUtil = lib.PhoneNumberUtil.getInstance()
} catch {}

function regionFromNumber(number) {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return null

  if (phoneUtil) {
    try {
      const parsed = phoneUtil.parse(`+${digits}`)
      const region = phoneUtil.getRegionCodeForNumber(parsed)
      if (region && region !== 'ZZ') return region
    } catch {}
  }

  for (const len of [3, 2, 1]) {
    const code = ARAB_CALLING_CODES[digits.slice(0, len)]
    if (code) return code
  }

  return null
}

function flagOf(region) {
  if (!region || !/^[A-Z]{2}$/.test(region)) return '🏳️'
  return String.fromCodePoint(
    ...[...region].map(c => 127397 + c.charCodeAt(0))
  )
}

function countryNameAr(region) {
  try {
    return new Intl.DisplayNames(['ar'], { type: 'region' }).of(region) || region
  } catch {
    return region
  }
}

const ARAB_FLAGS_LINE = ARAB_REGIONS.map(flagOf).join(' ')

export async function joinRequestUpdate(update) {
  const conn = this || global.conn || global.__Hammam_CONN__
  if (!conn?.sendMessage) return

  const groupId = update?.id
  if (!groupId || !groupId.endsWith('@g.us')) return

  // نتعامل فقط مع الطلب الجديد
  if (update.action && update.action !== 'created') return

  // الرقم الحقيقي: participantPn أولًا (حتى لو الطلب جاء بمعرّف LID)
  const rawPn = participantJidOf(update.participantPn)
  const rawId = participantJidOf(update.participant)

  let number = ''

  if (rawPn && !String(rawPn).endsWith('@lid')) {
    number = numberFromJid(rawPn)
  }

  if (!number && rawId) {
    if (String(rawId).endsWith('@lid')) {
      number = (await lidToPn(conn, rawId, groupId)) || ''
    } else {
      number = numberFromJid(rawId)
    }
  }

  const dedupeKey = `join:${groupId}:${number || rawId}`
  const now = Date.now()
  if (now - Number(guardSeen.get(dedupeKey) || 0) < 60_000) return
  guardSeen.set(dedupeKey, now)

  const meta = await getGroupMeta(conn, groupId)
  const groupName = meta?.subject || groupId

  const botNumbers = new Set([
    numberFromJid(conn.user?.id),
    numberFromJid(conn.user?.lid)
  ].filter(Boolean))

  // آخر المشرفين المتفاعلين، وإن ما فيه أحد نمنشن المطور
  let admins = (recentActiveAdmins.get(groupId) || [])
    .filter(jid => !botNumbers.has(canonNumber(jid)))
    .slice(-5)

  const owners = [...collectOwnerNumbers()]
  const admirals = (ADMIRAL_NUMBERS.length ? ADMIRAL_NUMBERS : owners)
    .map(numberFromJid)
    .filter(Boolean)

  const adminJids = admins.length
    ? admins
    : owners.map(n => `${n}@s.whatsapp.net`)

  const admiralJids = admirals.map(n => `${n}@s.whatsapp.net`)

  let numberLine
  let countryLine
  let warnLine = ''

  if (number) {
    const region = regionFromNumber(number)
    const isArab = region ? ARAB_REGIONS.includes(region) : false

    numberLine = `📞 *الرقم:* +${number}`

    countryLine = region
      ? `🌍 *الدولة:* ${flagOf(region)} ${countryNameAr(region)}`
      : `🌍 *الدولة:* 🏳️ غير معروفة`

    if (!isArab) {
      warnLine =
        `\n🚨 *تنبيه:* الدولة غير عربية! لا تدخله إلا بعد التأكد.`
    } else if (number.startsWith('972')) {
      warnLine =
        `\n⚠️ رمز 972 يستخدمه أيضًا فلسطينيون، تأكد قبل القرار.`
    }
  } else {
    numberLine = `📞 *الرقم:* ما قدرت أكشفه (معرّف مخفي)`
    countryLine = `🌍 *الدولة:* 🏳️ غير معروفة`
    warnLine = `\n🚨 *تنبيه:* ما انكشف الرقم، لا تدخله إلا بعد التأكد.`
  }

  const mentionLine = (adminJids.length
    ? adminJids.map(j => `@${canonNumber(j)}`).join(' ، ')
    : 'المشرفين')

  const admiralLine = admiralJids.map(j => `@${canonNumber(j)}`).join(' ، ')

  const text =
    `🛂 *حارس طلبات الانضمام*\n\n` +
    `🔔 ${mentionLine}\n` +
    `📥 *هناك طلب انضمام جديد* في *${groupName}*\n\n` +
    `${numberLine}\n` +
    `${countryLine}` +
    `${warnLine}\n\n` +
    `🕒 ${riyadhNowText()} (الرياض)\n\n` +
    `⚠️ إذا شككت في الأفتار أو الرقم لا تدخله، وامنشن الأدميرال ${admiralLine}\n` +
    `⚠️ وإذا كان علم الدولة مو من أعلام الدول العربية لا تدخله:\n` +
    `${ARAB_FLAGS_LINE}`

  const mentions = [...new Set([...adminJids, ...admiralJids])]

  await conn.sendMessage(groupId, { text, mentions }).catch(() => {})
}

export async function groupsUpdate() {}
export async function callUpdate() {}
export async function deleteUpdate() {}

// حفظ ومزامنة كل 5 دقائق.
// جميع الرسائل التي وصلت خلال الفترة تُدمج دفعة واحدة في البيانات.
setInterval(async () => {
  flushPendingMessageEvents()

  if (statsDirty) {
    statsDirty = false
    writeJson(
      STATS_FILE,
      stats
    )
  }

  await syncStatsToFirebase()
}, 5 * 60 * 1000)

// التذكير الدوري القديم محفوظ: تنبيه المطور كل 3 أيام عند دخول الساعة 1:00 صباحًا بتوقيت الرياض.
let lastDeveloperWarning = readJson(
  path.join(
    DATA_DIR,
    'developer_warning.json'
  ),
  {
    lastSent: 0,
    lastRiyadhDate: ''
  }
)

function getRiyadhDateKey() {
  const parts = riyadhParts()
  return `${parts.year}-${parts.month}-${parts.day}`
}

function shouldSendDeveloperWarning() {
  const parts = riyadhParts()
  const hour = Number(parts.hour)

  if (hour !== 1) {
    return false
  }

  const today =
    `${parts.year}-${parts.month}-${parts.day}`

  if (lastDeveloperWarning.lastRiyadhDate === today) {
    return false
  }

  return (
    Date.now() -
      Number(lastDeveloperWarning.lastSent || 0) >=
    3 * 24 * 60 * 60 * 1000
  )
}

async function sendDeveloperWarning(conn) {
  if (!shouldSendDeveloperWarning()) {
    return
  }

  const developer = global.owner?.[0] ? global.owner[0] + '@s.whatsapp.net' : null
  if (!developer) return

  try {
    await conn.sendMessage(
      developer,
      {
        text:
          '⏰ تذكير دوري: مرّت 3 أيام على آخر تنبيه للمطور.'
      }
    )

    lastDeveloperWarning.lastSent =
      Date.now()

    lastDeveloperWarning.lastRiyadhDate =
      getRiyadhDateKey()

    writeJson(
      path.join(
        DATA_DIR,
        'developer_warning.json'
      ),
      lastDeveloperWarning
    )
  } catch (e) {
    console.error(
      '[Hammam] فشل إرسال تنبيه المطور:',
      e?.message || e
    )
  }
}

// فحص مستقل كل 30 ثانية حتى لا يعتمد التنبيه على وصول رسالة
setInterval(async () => {
  try {
    await firebaseLoadPromise
    await sendDeveloperWarning(global.__Hammam_CONN__)
  } catch {}
}, 30_000)

// حفظ عند إغلاق العملية
process.on('SIGINT', () => {
  flushPendingMessageEvents()

  writeJson(
    STATS_FILE,
    stats
  )

  writeJson(
    ELITE_FILE,
    [...global.eliteUsers]
  )

  saveState()
})

process.on('SIGTERM', () => {
  flushPendingMessageEvents()

  writeJson(
    STATS_FILE,
    stats
  )

  writeJson(
    ELITE_FILE,
    [...global.eliteUsers]
  )

  saveState()
})

// ──────────────────────────────────────────────
// أدوات تُمرَّر لملفات plugins2/ عبر ctx.h
// ──────────────────────────────────────────────

const pluginHelpers = {
  delay,
  numberFromJid,
  normalizeJid,
  canonNumber,
  getTargetJid,
  findGroupMember,
  lidToPn,
  resolveSender,
  isOwner,
  isElite,
  getText,
  removeEliteIdentity,
  saveElite,
  saveState,
  savedState,
  stats,
  groupMetaCache,
  groupAdminCache,
  getPendingEvents,
  ensureGroupStats,
  todayKey,
  dailyCounts,
  getTodayStats,
  formatCount,
  riyadhNowText,
  sendStats,
  sendInactive,
  sendChunked
}

// ──────────────────────────────────────────────
// واجهة للموجّه (handler.js)
// ──────────────────────────────────────────────

export function readCommandText(message) {
  return stripInvisibleChars(getText(message).trim())
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function isDeveloper(conn, message) {
  try {
    const chat = message?.key?.remoteJid || ''
    const sender = await resolveSender(conn, message)
    return Boolean(await isOwner(conn, sender, chat))
  } catch {
    return false
  }
}

// هل هذه الرسالة أمر حماية سيرد عليه هيندر 1؟ (عشان هيندر 2 ما يرد عليها مرة ثانية)
export async function handlesMessage(conn, message) {
  try {
    if (!message?.message || message.key?.fromMe) return false

    const text = readCommandText(message)
    if (!text.startsWith('.')) return false

    const hit = findPlugin2(text)
    if (!hit) return false

    const { plugin, file } = hit
    if (conn?.sub?.dis?.has('p2:' + file)) return false
    if ((plugin.access || 'elite') === 'all') return true
    if (OPEN_STATS_FOR_ALL && plugin.open === true) return true

    const chat = message.key?.remoteJid || ''
    const sender = await resolveSender(conn, message)
    if (await isOwner(conn, sender, chat)) return true
    return Boolean(await isElite(conn, sender, chat))
  } catch {
    return false
  }
}
