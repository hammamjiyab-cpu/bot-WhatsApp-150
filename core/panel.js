// core/panel.js — API لوحة التحكم (الصفحة الخارجية panel/index.html تتصل فيه)
import http from 'http'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'panel.json')
const digits = v => String(v || '').replace(/\D/g, '')
const state = (global.panelState = global.panelState || { paused: false, disabled: [], deputies: [] })
global.panelDisabled = global.panelDisabled || new Set()
const codes = new Map()  // رقم -> كود الدخول
const tokens = new Map() // توكن -> جلسة

function load() {
  try { Object.assign(state, JSON.parse(fs.readFileSync(FILE, 'utf8'))) } catch {}
  global.panelDisabled = new Set(state.disabled || [])
}
function save() {
  state.disabled = [...global.panelDisabled]
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(state)) } catch {}
}
const linked = () => !!global.panelLink?.state?.creds?.registered
let lastLink = 0
const botNumber = () => digits(String(global.conn?.user?.id || '').split(/[:@]/)[0] || global.botNumberCode)

// صاحب الجلسة (رقم البوت) = نائب مطور، ورتبة "نائب" = نفس صلاحيات المطور
export function syncOwners() {
  global.__baseOwners = global.__baseOwners || [...(global.owner || [])]
  global.owner = [...new Set([...global.__baseOwners.map(digits), botNumber(), ...(state.deputies || [])].filter(Boolean))]
}
const isDev = n => n === botNumber() || (global.__baseOwners || []).map(digits).includes(n)
const allowed = n => isDev(n) || (state.deputies || []).includes(n)

const cmdOf = p => {
  const c = p?.command
  return c instanceof RegExp ? c.source.slice(0, 40) : [].concat(c || []).map(String).join(' | ')
}
const entries = (g, obj) =>
  Object.entries(obj || {}).map(([file, p]) => ({
    g, file, name: file.replace(/\.js$/, ''), cmd: cmdOf(p), on: !global.panelDisabled.has(`${g}:${file}`)
  }))

const SB = () => global.subBots
let lastSub = 0

// سياق الجلسة: البوت الأساسي أو بوت فرعي (حسب اللي سجّل دخول)
function ctx(tok) {
  if (tok.bot === 'main') return {
    main: true, paused: () => state.paused, setPaused: v => { state.paused = v; save() },
    off: k => global.panelDisabled.has(k), deputies: () => state.deputies, canManage: isDev(tok.number)
  }
  const m = SB()?.meta(tok.bot)
  return m && {
    main: false, m, paused: () => m.paused, setPaused: v => { m.paused = v; m.save() },
    off: k => m.dis.has(k), deputies: () => m.deputies, canManage: tok.number === tok.bot
  }
}
const lister = c => g => Object.entries((g === 'p1' ? global.plugins : global.plugins2) || {}).map(([file, p]) => ({
  g, file, name: file.replace(/\.js$/, ''), cmd: cmdOf(p), on: !c.off(`${g}:${file}`)
}))

const routes = {
  'GET /panel/status': () => {
    const b = botNumber()
    return { linked: linked(), bot: linked() && b.length > 6 ? b.slice(0, 3) + '•••' + b.slice(-4) : null,
      subs: SB()?.list().length ?? 0, max: SB()?.max ?? 0 }
  },
  'POST /panel/link': async b => {
    if (linked()) return { error: 'البوت الأساسي مربوط. اربط بوت فرعي من نفس الصفحة.' }
    const n = digits(b.number)
    if (n.length < 8 || n.length > 15) return { error: 'اكتب الرقم بالمفتاح الدولي بدون + (مثال 9665xxxxxxxx)' }
    if (Date.now() - lastLink < 30000) return { error: 'انتظر 30 ثانية ثم حاول مرة ثانية' }
    lastLink = Date.now()
    try {
      const raw = await global.conn.requestPairingCode(n, 'ABCD1234')
      global.botNumberCode = n
      return { code: String(raw).match(/.{1,4}/g)?.join('-') || raw }
    } catch { return { error: 'البوت ما جهز بعد، جرّب بعد 10 ثواني' } }
  },
  'POST /panel/sub-link': async b => {
    if (!SB()) return { error: 'نظام البوتات الفرعية غير جاهز' }
    const n = digits(b.number)
    if (n.length < 8 || n.length > 15) return { error: 'اكتب الرقم بالمفتاح الدولي بدون + (مثال 9665xxxxxxxx)' }
    if (Date.now() - lastSub < 20000) return { error: 'انتظر 20 ثانية ثم حاول مرة ثانية' }
    lastSub = Date.now()
    return SB().link(n)
  },
  'POST /panel/sub-status': b => ({ linked: !!SB()?.linked(digits(b.number)) }),
  'POST /panel/request': async b => {
    const n = digits(b.number), old = codes.get(n)
    const bot = allowed(n) ? 'main' : SB()?.resolve(n)
    if (bot && !(old && Date.now() - old.last < 60000)) {
      const code = String(crypto.randomInt(100000, 1000000))
      codes.set(n, { code, bot, exp: Date.now() + 300000, tries: 0, last: Date.now() })
      await global.conn?.sendMessage(n + '@s.whatsapp.net', {
        text: `🔐 كود دخول لوحة Hammam Bot: *${code}*\nصالح 5 دقائق، لا تشاركه مع أحد.`
      }).catch(() => {})
    }
    return { ok: true } // نفس الرد دايمًا عشان ما ينكشف مين مسموح له
  },
  'POST /panel/verify': b => {
    const n = digits(b.number), c = codes.get(n)
    if (!c || c.exp < Date.now() || ++c.tries > 5) { codes.delete(n); return { error: 'الكود غلط أو منتهي، اطلب كود جديد' } }
    if (c.code !== String(b.code).trim()) return { error: 'الكود غلط' }
    codes.delete(n)
    const token = crypto.randomBytes(24).toString('hex')
    tokens.set(token, { number: n, bot: c.bot, exp: Date.now() + 12 * 3600e3 })
    return { token }
  },
  'GET /panel/state': (_, who, tok) => {
    const c = ctx(tok); if (!c) return { error: 'الجلسة غير موجودة' }
    const l = lister(c)
    return {
      paused: !!c.paused(), bot: tok.bot === 'main' ? botNumber() : tok.bot, sub: !c.main, me: who, canManage: c.canManage,
      deputies: c.deputies(), items: [...l('p2'), ...l('p1')], max: SB()?.max,
      subs: c.main && isDev(who) ? SB()?.list() || [] : undefined
    }
  },
  'POST /panel/toggle': (b, _, tok) => {
    const c = ctx(tok); if (!c) return { error: 'الجلسة غير موجودة' }
    const p = (b.g === 'p1' ? global.plugins : b.g === 'p2' ? global.plugins2 : null)?.[b.file]
    if (!p) return { error: 'الأمر غير موجود' }
    const key = `${b.g}:${b.file}`
    if (c.main) { if (b.on) { global.panelDisabled.delete(key); p.disabled = false } else { global.panelDisabled.add(key); p.disabled = true }; save() }
    else { b.on ? c.m.dis.delete(key) : c.m.dis.add(key); c.m.save() }
    return { ok: true }
  },
  'POST /panel/pause': (b, _, tok) => { const c = ctx(tok); if (!c) return { error: 'الجلسة غير موجودة' }; c.setPaused(!!b.paused); return { ok: true } },
  'POST /panel/deputy': (b, _, tok) => {
    const c = ctx(tok)
    if (!c?.canManage) return { error: 'إدارة النواب لصاحب الجلسة فقط' }
    const n = digits(b.number)
    if (n.length < 7) return { error: 'رقم غير صحيح' }
    const arr = c.deputies(), i = arr.indexOf(n)
    if (b.add) { if (i < 0) arr.push(n) } else if (i >= 0) arr.splice(i, 1)
    if (c.main) { save(); syncOwners() } else { c.m.save(); c.m.sync() }
    return { ok: true }
  },
  'POST /panel/sub-remove': async (b, who, tok) => {
    const n = digits(b.number)
    if (!(tok.bot === 'main' ? isDev(who) : tok.bot === n && who === n)) return { error: 'ما عندك صلاحية' }
    await SB()?.remove(n); return { ok: true }
  }
}
for (const k of ['POST /panel/request', 'POST /panel/verify', 'GET /panel/status', 'POST /panel/link', 'POST /panel/sub-link', 'POST /panel/sub-status']) routes[k].open = true

export function startPanel() {
  if (global.__panelStarted) return
  global.__panelStarted = true
  load(); syncOwners()
  for (const k of global.panelDisabled) { // طبّق المعطّل على اللي تحمّل قبل
    const [g, f] = k.split(/:(.+)/)
    const p = (g === 'p1' ? global.plugins : global.plugins2)?.[f]
    if (p) p.disabled = true
  }
  const port = Number(process.env.PANEL_PORT || process.env.PORT || process.env.SERVER_PORT || 3000)
  http.createServer(async (req, res) => {
    const h = {
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Content-Type': 'application/json; charset=utf-8'
    }
    const send = (c, o) => { res.writeHead(c, h); res.end(JSON.stringify(o)) }
    if (req.method === 'OPTIONS') return send(204, {})
    if (req.method === 'GET' && ['/', '/panel', '/panel/'].includes(req.url.split('?')[0])) {
      try {
        const html = fs.readFileSync(path.join(path.dirname(FILE), '..', 'panel', 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(html)
      } catch { return send(404, { error: 'panel/index.html غير موجود' }) }
    }
    const route = routes[`${req.method} ${req.url.split('?')[0]}`]
    if (!route) return send(404, { error: 'not found' })
    let who = null, tok = null
    if (!route.open) {
      const t = tokens.get((req.headers.authorization || '').slice(7))
      if (!t || t.exp < Date.now()) return send(401, { error: 'سجّل دخولك من جديد' })
      who = t.number; tok = t
    }
    try {
      let raw = ''
      for await (const c of req) { raw += c; if (raw.length > 1e4) return send(413, { error: 'كبير' }) }
      send(200, await route(raw ? JSON.parse(raw) : {}, who, tok))
    } catch { send(400, { error: 'طلب غلط' }) }
  }).on('error', e => console.log('⚠️ لوحة التحكم:', e.message))
    .listen(port, () => console.log(`🌐 API لوحة التحكم على المنفذ ${port}`))
}
