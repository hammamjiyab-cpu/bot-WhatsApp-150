/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import axios from 'axios'
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import { theme } from '../core/theme.js'

const SEARCH_API = 'https://www.monte-dev.online/api/search/tiktok-search'
const MAX_ROWS = 10
const CACHE_TTL = 10 * 60 * 1000
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// نتائج البحث لكل (محادثة + مستخدم) لحين اختيار المستخدم
const cache = new Map()
const keyOf = (m) => `${m.chat}:${m.sender}`
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }
const num = (n) => Number(n || 0).toLocaleString('en-US')

async function react(conn, m, emoji) {
  try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
}

async function getHDVideoBuffer(videoUrl) {
  const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`, { timeout: 30000 })
  const data = res.data?.data
  const url = data?.hdplay || data?.play
  if (!url) return null
  const file = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000, headers: { 'User-Agent': UA } })
  return Buffer.from(file.data)
}

// ───────── رسالة واحدة: قائمة بأسماء الفيديوهات فقط ─────────
async function sendList(conn, m, query, videos, prefix) {
  const rows = videos.map((v, i) => ({
    header: '',
    title: `${i + 1}. ${cut(v.desc || 'بدون عنوان', 60)}`,
    description: `👤 ${cut(v.author?.name || 'مجهول', 24)}  ·  👁 ${num(v.stats?.plays)}  ·  ❤️ ${num(v.stats?.likes)}`,
    id: `${prefix}ايديت اختيار ${i + 1}`
  }))

  const body = theme.build([
    { type: 'title', text: 'ايديـت تـيـك تـوك' },
    { type: 'divider' },
    { type: 'info', label: 'البحث', value: cut(query, 40) },
    { type: 'info', label: 'النتائج', value: `${videos.length} مقطع` },
    { type: 'divider' },
    { type: 'line', text: '👇 اضغط الزر واختر المقطع المناسب' },
    { type: 'line', text: `🔢 أو اكتب: ${prefix}ايديت 3` }
  ], { phrase: 'charisma' })

  const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
    body: { text: body },
    footer: { text: global.watermark || global.botName || '' },
    header: { hasMediaAttachment: false, title: '' },
    nativeFlowMessage: {
      buttons: [{
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: '🎬 قائمة المقاطع',
          sections: [{ title: 'اختر المقطع', rows }]
        })
      }]
    }
  })
  const msg = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage } } }, { userJid: conn.user.jid, quoted: m })
  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

// ───────── بعد الاختيار: إرسال المقطع المختار فقط ─────────
async function sendChosen(conn, m, index) {
  const entry = cache.get(keyOf(m))
  if (!entry || Date.now() - entry.t > CACHE_TTL) {
    cache.delete(keyOf(m))
    return m.reply(theme.error('انتهت صلاحية القائمة، ابحث من جديد.'))
  }
  const vid = entry.videos[index - 1]
  if (!vid) return m.reply(theme.error(`اختر رقماً من 1 إلى ${entry.videos.length}`))

  await react(conn, m, '⏳')
  try {
    const buffer = await getHDVideoBuffer(vid.url)
    if (!buffer) throw new Error('تعذّر جلب المقطع')
    const caption = theme.build([
      { type: 'title', text: 'ايديـت تـيـك تـوك' },
      { type: 'divider' },
      { type: 'info', label: 'الصانع', value: vid.author?.name || 'مجهول' },
      { type: 'info', label: 'المشاهدات', value: num(vid.stats?.plays) },
      { type: 'info', label: 'الإعجابات', value: num(vid.stats?.likes) },
      { type: 'line', text: `📝 ${cut(vid.desc || 'بدون وصف', 80)}` }
    ], { phrase: 'pride' })
    await conn.sendMessage(m.chat, { video: buffer, mimetype: 'video/mp4', caption }, { quoted: m })
    await react(conn, m, '✅')
  } catch (e) {
    await react(conn, m, '❌')
    return m.reply(theme.error(`تعذّر تحميل المقطع: ${e.message}`))
  }
}

let handler = async (m, { conn, text, usedPrefix = '.', command }) => {
  text = (text || '').trim()

  // اختيار من القائمة: ".ايديت اختيار 3" أو ".ايديت 3"
  const pick = text.match(/^(?:اختيار\s+)?(\d{1,2})$/)
  if (pick) {
    if (cache.has(keyOf(m))) return sendChosen(conn, m, parseInt(pick[1]))
    return m.reply(theme.warning(`انتهت صلاحية القائمة. ابحث أولاً: ${usedPrefix}${command} كلمة البحث`))
  }

  if (!text) {
    return m.reply(theme.usage('ايديـت تـيـك تـوك', `${usedPrefix}${command} كلمة البحث`, `${usedPrefix}${command} رصاصه رحمه`))
  }

  await react(conn, m, '🔎')
  try {
    const { data } = await axios.get(`${SEARCH_API}?q=${encodeURIComponent(text)}`, { timeout: 30000 })
    const videos = (data?.result?.videos || []).filter(v => v?.url).slice(0, MAX_ROWS)
    if (!videos.length) {
      await react(conn, m, '❌')
      return m.reply(theme.warning(`لا توجد نتائج لـ: ${cut(text, 40)}`))
    }
    cache.set(keyOf(m), { t: Date.now(), videos })
    // تنظيف الكاش القديم
    for (const [k, v] of cache) if (Date.now() - v.t > CACHE_TTL) cache.delete(k)
    await sendList(conn, m, text, videos, usedPrefix)
    await react(conn, m, '✅')
  } catch (e) {
    await react(conn, m, '❌')
    return m.reply(theme.error(`خطأ أثناء البحث: ${e.message}`))
  }
}

handler.help = ['ايديت <بحث>']
handler.tags = ['downloader', 'search']
handler.command = /^(ايديت|بحث-تيك|tiktoksearch)$/i

export default handler
