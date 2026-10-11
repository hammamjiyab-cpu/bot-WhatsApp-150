// core/subbots.js — البوتات الفرعية (حتى MAX_SUBS) تنربط من صفحة اللوحة، لكل واحد جلسته وإعداداته
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys'
import { makeWASocket } from './Prototype_core.js'
import { handler, participantsUpdate, groupsUpdate, callUpdate, deleteUpdate, joinRequestUpdate } from '../handler.js'

const DIR = path.resolve('./subbots')
const MAX = Number(process.env.MAX_SUBS || 15)
const subs = new Map() // رقم -> { sock, meta, state, status, timer }
const sleep = ms => new Promise(r => setTimeout(r, ms))
global.conns = Array.isArray(global.conns) ? global.conns : []

function loadMeta(n) {
  const f = path.join(DIR, n, 'panel.json')
  let j = {}
  try { j = JSON.parse(fs.readFileSync(f, 'utf8')) } catch {}
  const meta = {
    paused: !!j.paused, dis: new Set(j.disabled || []), deputies: j.deputies || [], owners: new Set(),
    save() { try { fs.writeFileSync(f, JSON.stringify({ paused: meta.paused, disabled: [...meta.dis], deputies: meta.deputies })) } catch {} },
    sync() { meta.owners = new Set([n, ...meta.deputies]) } // صاحب الجلسة + النواب = مطور داخل هالبوت فقط
  }
  meta.sync()
  return meta
}

async function start(n) {
  const dir = path.join(DIR, n)
  fs.mkdirSync(dir, { recursive: true })
  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const { version } = await fetchLatestBaileysVersion()
  const meta = subs.get(n)?.meta || loadMeta(n)
  const quiet = pino({ level: 'silent' })
  const sock = makeWASocket({
    version, logger: quiet, printQRInTerminal: false, browser: Browsers.windows('Chrome'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, quiet) },
    markOnlineOnConnect: false, syncFullHistory: false, generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000, keepAliveIntervalMs: 30000
  })
  sock.sub = meta; sock.isSub = true
  const rec = { sock, meta, state, status: 'connecting', timer: subs.get(n)?.timer }
  subs.set(n, rec)

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      rec.status = 'online'
      try { // نسخة إعدادات البوت الأساسي للفرعي لو ما عنده
        const s = (global.db.data.settings ||= {}), jid = sock.user?.jid || sock.user?.id
        const main = s[global.conn?.user?.jid]
        if (jid && !s[jid] && main) s[jid] = structuredClone(main)
      } catch {}
      if (!global.conns.includes(sock)) global.conns.push(sock)
      console.log(`🤖 بوت فرعي متصل: +${n}`)
    }
    if (connection === 'close') {
      rec.status = 'offline'
      const i = global.conns.indexOf(sock); if (i >= 0) global.conns.splice(i, 1)
      const code = lastDisconnect?.error?.output?.statusCode
      if (code === DisconnectReason.loggedOut || code === 403) return remove(n)
      if (subs.get(n) === rec && state.creds.registered)
        setTimeout(() => subs.get(n) === rec && start(n).catch(e => console.log('⚠️ إعادة اتصال فرعي', n, e.message)), 5000)
    }
  })
  const on = (ev, fn) => sock.ev.on(ev, async u => {
    if (meta.paused) return // إيقاف مؤقت من اللوحة
    try { await fn.call(sock, u) } catch (e) { console.error(`❌ [فرعي ${n}] ${ev}:`, e?.message || e) }
  })
  on('messages.upsert', handler); on('group-participants.update', participantsUpdate); on('groups.update', groupsUpdate)
  on('call', callUpdate); on('messages.delete', deleteUpdate); on('group.join-request', joinRequestUpdate)
  return rec
}

async function remove(n) {
  const rec = subs.get(n)
  subs.delete(n)
  if (rec?.timer) clearTimeout(rec.timer)
  try { await rec?.sock.logout() } catch {}
  try { rec?.sock.end?.() } catch {}
  const i = global.conns.indexOf(rec?.sock); if (i >= 0) global.conns.splice(i, 1)
  try { fs.rmSync(path.join(DIR, n), { recursive: true, force: true }) } catch {}
}

const registered = n => !!subs.get(n)?.state.creds.registered

async function link(n) {
  if (n === String(global.botNumberCode || '').replace(/\D/g, '')) return { error: 'هذا رقم البوت الأساسي' }
  if (registered(n)) return { error: 'هذا الرقم مربوط من قبل' }
  if (subs.has(n)) await remove(n) // محاولة ربط قديمة ما اكتملت
  if (subs.size >= MAX) return { error: `وصلنا للحد الأقصى (${MAX} بوت فرعي)` }
  try {
    const rec = await start(n)
    await sleep(4000)
    const raw = await rec.sock.requestPairingCode(n, 'Hammam02')
    rec.timer = setTimeout(() => { if (!registered(n)) remove(n) }, 4 * 60e3) // ما اكتمل الربط = نحذف المحاولة
    return { code: String(raw).match(/.{1,4}/g)?.join('-') || raw }
  } catch (e) {
    await remove(n)
    return { error: 'ما قدرت أجهز الكود، جرّب بعد شوي' }
  }
}

export async function restore() {
  if (global.__subsRestored) return
  global.__subsRestored = true
  if (!fs.existsSync(DIR)) return
  for (const n of fs.readdirSync(DIR)) {
    try {
      if (!/^\d+$/.test(n) || subs.size >= MAX) continue
      if (!JSON.parse(fs.readFileSync(path.join(DIR, n, 'creds.json'), 'utf8')).registered) continue
      await start(n); await sleep(3000) // فاصل بين كل بوت عشان المعالج
    } catch (e) { console.log('⚠️ بوت فرعي', n, e.message) }
  }
}

global.subBots = {
  max: MAX, link, remove, restore,
  has: n => subs.has(n), linked: registered, meta: n => subs.get(n)?.meta,
  list: () => [...subs].map(([number, r]) => ({ number, status: r.status, paused: r.meta.paused, linked: registered(number) })),
  resolve: n => (registered(n) ? n : [...subs].find(([k, r]) => registered(k) && r.meta.deputies.includes(n))?.[0] || null)
}
