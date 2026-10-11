// 🌐 خادم إحصائيات المجموعات — بدون Plugin
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const LINKS_FILE = path.join(DATA_DIR, 'stats_links.json')
const PORT_DEFAULT = Number(process.env.PORT || process.env.SERVER_PORT || 3000)
const REFRESH_MS = 5 * 60 * 1000

function readLinks() {
  try {
    const data = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'))
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
}

function getStats(chatId) {
  const stats = global.__chatStatsCache?.get(chatId) || global.db?.data?.stats?.[chatId]
  return stats || null
}

async function loadStats(chatId) {
  const cached = getStats(chatId)
  if (cached) return cached
  try {
    if (global.db?.readData) return await global.db.readData('stats', chatId)
  } catch {}
  return null
}

async function resolveToken(token) {
  const links = global.__statsLinks || readLinks()
  for (const [chatId, value] of Object.entries(links)) {
    if (value === token) return chatId
  }
  return null
}

function topEntries(obj, limit = 10) {
  return Object.entries(obj || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, limit)
    .map(([key, value]) => ({ key, value: Number(value || 0) }))
}

async function makeApi(chatId) {
  const stats = await loadStats(chatId)
  if (!stats) return null

  let groupName = stats.groupName || 'المجموعة'
  if (groupName === 'المجموعة' && global.conn?.groupMetadata) {
    try {
      const meta = await global.conn.groupMetadata(chatId)
      if (meta?.subject) {
        groupName = meta.subject
        stats.groupName = meta.subject
      }
    } catch {}
  }

  const users = Object.values(stats.users || {})
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
    .slice(0, 100)
    .map(u => ({
      name: u.name || String(u.jid || '').split('@')[0],
      jid: u.jid,
      count: Number(u.count || 0),
      text: Number(u.text || 0),
      media: Number(u.media || 0),
      lastAt: u.lastAt || 0
    }))

  return {
    groupId: chatId,
    groupName,
    updatedAt: stats.updatedAt || Date.now(),
    totalMessages: Number(stats.totalMessages || 0),
    totalTextMessages: Number(stats.totalTextMessages || 0),
    totalMediaMessages: Number(stats.totalMediaMessages || 0),
    links: Number(stats.links || 0),
    activeUsers: Object.keys(stats.users || {}).length,
    hourly: stats.hourly || Array(24).fill(0),
    weekdays: stats.weekdays || Array(7).fill(0),
    daily: topEntries(stats.daily || {}, 31),
    monthly: topEntries(stats.monthly || {}, 12),
    words: topEntries(stats.words || {}, 20),
    emojis: topEntries(stats.emojis || {}, 20),
    messageTypes: topEntries(stats.messageTypes || {}, 12),
    users
  }
}

function pageTemplate(token) {
  const safeToken = escapeHtml(token)
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>إحصائيات المجموعة</title>
<style>
:root{color-scheme:dark;font-family:Tahoma,Arial,sans-serif}*{box-sizing:border-box}body{margin:0;background:#0b0d12;color:#f4f5f7}main{max-width:1200px;margin:auto;padding:24px}.head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:22px}.title{font-size:28px;font-weight:800}.muted{color:#9299a8;font-size:13px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.card{background:#121620;border:1px solid #202635;border-radius:18px;padding:18px;box-shadow:0 10px 30px #0003}.num{font-size:28px;font-weight:800;margin-top:8px}.label{color:#9aa2b2;font-size:13px}.wide{grid-column:span 2}.full{grid-column:1/-1}.bars{height:240px;display:flex;align-items:end;gap:5px;padding-top:20px}.bar{flex:1;min-width:5px;background:#6f7cff;border-radius:7px 7px 2px 2px;position:relative}.bar span{position:absolute;bottom:calc(100% + 5px);font-size:10px;color:#9da5b5;width:100%;text-align:center}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:10px;border-bottom:1px solid #222938;text-align:right}.table th{color:#9da5b5;font-size:12px}.pill{display:inline-block;padding:5px 9px;background:#1a2030;border-radius:999px;margin:3px}.chips{line-height:2}.status{padding:7px 11px;border-radius:999px;background:#17221c;color:#8be0a7;font-size:12px}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:800px){main{padding:14px}.grid{grid-template-columns:1fr 1fr}.wide{grid-column:1/-1}.two{grid-template-columns:1fr}}@media(max-width:500px){.grid{grid-template-columns:1fr}.head{align-items:flex-start;flex-direction:column}.title{font-size:22px}}
</style>
</head>
<body>
<main>
<div class="head"><div><div class="title" id="group">إحصائيات المجموعة</div><div class="muted">رابط ثابت — البيانات تتحدث تلقائيًا كل 5 دقائق</div></div><div class="status" id="status">جاري التحميل...</div></div>
<div class="grid">
<div class="card"><div class="label">إجمالي الرسائل</div><div class="num" id="total">0</div></div>
<div class="card"><div class="label">الأعضاء المتفاعلون</div><div class="num" id="users">0</div></div>
<div class="card"><div class="label">الرسائل النصية</div><div class="num" id="text">0</div></div>
<div class="card"><div class="label">الروابط</div><div class="num" id="links">0</div></div>
<div class="card wide"><div class="label">النشاط حسب الساعة</div><div class="bars" id="hours"></div></div>
<div class="card wide"><div class="label">النشاط حسب أيام الأسبوع</div><div class="bars" id="days"></div></div>
<div class="card full"><div class="label">أكثر الأعضاء نشاطًا</div><table class="table"><thead><tr><th>#</th><th>العضو</th><th>الرسائل</th><th>نص</th><th>وسائط</th></tr></thead><tbody id="members"></tbody></table></div>
<div class="two full"><div class="card"><div class="label">أكثر الكلمات استخدامًا</div><div class="chips" id="words"></div></div><div class="card"><div class="label">أكثر الإيموجيات استخدامًا</div><div class="chips" id="emojis"></div></div></div>
<div class="two full"><div class="card"><div class="label">النشاط اليومي</div><div class="chips" id="daily"></div></div><div class="card"><div class="label">النشاط الشهري</div><div class="chips" id="monthly"></div></div></div>
</div>
</main>
<script>
const TOKEN=${JSON.stringify(token)};
const REFRESH=${REFRESH_MS};
const fmt=n=>new Intl.NumberFormat('ar-SA').format(n||0);
function renderBars(el,arr,labels){const box=document.getElementById(el);const max=Math.max(1,...arr);box.innerHTML=arr.map((v,i)=>'<div class="bar" style="height:'+Math.max(3,(v/max)*190)+'px"><span>'+fmt(v)+'<br>'+labels[i]+'</span></div>').join('')}
function chips(id,items){document.getElementById(id).innerHTML=(items||[]).map(x=>'<span class="pill">'+x.key+' · '+fmt(x.value)+'</span>').join('')||'<span class="muted">لا توجد بيانات بعد</span>'}
async function load(){try{const r=await fetch('/api/g/'+encodeURIComponent(TOKEN),{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();document.getElementById('group').textContent=d.groupName||'إحصائيات المجموعة';document.getElementById('total').textContent=fmt(d.totalMessages);document.getElementById('users').textContent=fmt(d.activeUsers);document.getElementById('text').textContent=fmt(d.totalTextMessages);document.getElementById('links').textContent=fmt(d.links);renderBars('hours',d.hourly,Array.from({length:24},(_,i)=>i+':00'));renderBars('days',d.weekdays,['أح','اث','ثل','أر','خم','جم','سب']);document.getElementById('members').innerHTML=(d.users||[]).map((u,i)=>'<tr><td>'+((i+1))+'</td><td>'+escapeHtml(u.name)+'</td><td>'+fmt(u.count)+'</td><td>'+fmt(u.text)+'</td><td>'+fmt(u.media)+'</td></tr>').join('');chips('words',d.words);chips('emojis',d.emojis);chips('daily',d.daily);chips('monthly',d.monthly);document.getElementById('status').textContent='آخر تحديث: '+new Date(d.updatedAt).toLocaleString('ar-SA')}catch(e){document.getElementById('status').textContent='تعذر تحميل البيانات'}}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
load();setInterval(load,REFRESH);
</script>
</body></html>`
}

export default async function startStatsServer(conn, port = PORT_DEFAULT) {
  global.conn = conn || global.conn
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
      if (url.pathname === '/health') {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        return res.end(JSON.stringify({ ok: true, uptime: process.uptime() }))
      }

      const apiMatch = url.pathname.match(/^\/api\/g\/([^/]+)$/)
      if (apiMatch) {
        const token = decodeURIComponent(apiMatch[1])
        const chatId = await resolveToken(token)
        if (!chatId) { res.writeHead(404); return res.end(JSON.stringify({ error: 'not_found' })) }
        const data = await makeApi(chatId)
        if (!data) { res.writeHead(404); return res.end(JSON.stringify({ error: 'stats_not_found' })) }
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        return res.end(JSON.stringify(data))
      }

      const pageMatch = url.pathname.match(/^\/g\/([^/]+)$/)
      if (pageMatch) {
        const token = decodeURIComponent(pageMatch[1])
        const chatId = await resolveToken(token)
        if (!chatId) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('الرابط غير موجود') }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
        return res.end(pageTemplate(token))
      }

      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end('<meta charset="utf-8"><title>إحصائيات البوت</title><h2 style="font-family:Tahoma;text-align:center;margin-top:20vh">استخدم رابط المجموعة المرسل من أمر .حسبه</h2>')
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Internal Server Error')
    }
  })

  server.listen(port, '0.0.0.0', () => console.log(`🌐 Stats server listening on :${port}`))
  global.statsServer = server
  return server
}
