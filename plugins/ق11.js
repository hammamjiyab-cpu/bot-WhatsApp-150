// plugins/ق11.js
// ✦ Hammam Bot — قـسـم الـمـطـوّر
// رسالة واحدة · قوائم منظمة · عبارات (دين · فخر · كاريزما)

import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'
import { theme } from '../core/theme.js'

const BRAND = 'Hammam Bot'
const CHANNEL = global.CHANNEL_LINK
const DEV = (String(global.owner?.[0] || ''))
const IMAGE_URL = 'https://file.garden/aopbTIvyBCZ1OfsC/cdea898a4f8522dfd062fa92a0b0e136.jpg'

const SECTION = {"emoji": "👑", "title": "قـسـم الـمـطـوّر", "phrase": "charisma", "ownerOnly": true, "groups": [{"title": "🔐 الـتـحـكـم", "items": [["بلوقن", "إدارة الإضافات"], ["ريستارت", "إعادة تشغيل البوت"], ["بنج", "سرعة الاستجابة"], ["اطلع", "خروج من مجموعة"], ["اخر30", "آخر 30 رسالة"]]}, {"title": "📡 الـنـشـر", "items": [["بوست", "نشر إعلان"], ["سكربتي", "نسخة البوت"], ["كود", "عرض كود أمر"]]}]}
const SECTIONS = [{"cmd": "ق1", "emoji": "👮", "title": "قـسـم الإشـراف", "desc": "الأدمن والإدارة"}, {"cmd": "ق2", "emoji": "🎨", "title": "قـسـم الـمـلـصـقـات", "desc": "الاستيكر والتصميم"}, {"cmd": "ق3", "emoji": "🎮", "title": "قـسـم الألـعـاب", "desc": "تحدّي وتسلية"}, {"cmd": "ق4", "emoji": "📥", "title": "قـسـم الـتـحـمـيـل", "desc": "فيديو · صوت · ملفات"}, {"cmd": "ق5", "emoji": "🛠️", "title": "قـسـم الأدوات", "desc": "تحويل وتحسين"}, {"cmd": "ق6", "emoji": "📚", "title": "قـسـم الـمـانـجـا", "desc": "مانجا ومانهوا"}, {"cmd": "ق7", "emoji": "🤖", "title": "قـسـم الـذكـاء", "desc": "ذكاء اصطناعي"}, {"cmd": "ق8", "emoji": "👥", "title": "قـسـم الـنـقـابـات", "desc": "الألقاب والتسجيل"}, {"cmd": "ق9", "emoji": "🖼️", "title": "قـسـم الـصـور", "desc": "خلفيات وتطقيم"}, {"cmd": "ق10", "emoji": "🎉", "title": "قـسـم الـتـرفـيـه", "desc": "مرح وفعاليات"}]

let imageCache = null
async function getImage(conn) {
  if (imageCache) return imageCache
  try {
    const res = await fetch(IMAGE_URL, { signal: AbortSignal.timeout(8000) })
    const buf = Buffer.from(await res.arrayBuffer())
    const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer })
    imageCache = media.imageMessage
  } catch { imageCache = null }
  return imageCache
}

async function safeName(conn, jid) {
  try { return (await conn.getName(jid)) || 'صديقي' } catch { return 'صديقي' }
}

const uptime = () => {
  const s = Math.floor(process.uptime())
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

function buildText(name, p) {
  if (!SECTION) {
    const date = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    return theme.build([
      { type: 'title', text: BRAND },
      { type: 'divider' },
      { type: 'info', label: 'الـمـسـتـخـدم', value: name },
      { type: 'info', label: 'الـتـشـغـيـل', value: uptime() },
      { type: 'info', label: 'الـتـاريـخ', value: date },
      { type: 'divider' },
      { type: 'subtitle', text: 'الأقـسـام الـمـتـاحـة' },
      ...SECTIONS.map(s => ({ type: 'line', text: `${s.emoji} ${s.title}` })),
      { type: 'divider' },
      { type: 'line', text: '👇 اضغط الزر واختر القسم المناسب' }
    ], { phrase: 'pride' })
  }
  const blocks = [
    { type: 'title', text: `${SECTION.emoji} ${SECTION.title}` },
    { type: 'info', label: 'الـمـسـتـخـدم', value: name }
  ]
  for (const g of SECTION.groups) {
    blocks.push({ type: 'divider' }, { type: 'subtitle', text: g.title })
    for (const [cmd, desc] of g.items) blocks.push({ type: 'line', text: `◈ ${p}${cmd} ⟵ ${desc}` })
  }
  if (SECTION.ownerOnly) blocks.push({ type: 'divider' }, { type: 'warning', text: 'جميع أوامر هذا القسم للمطوّر فقط' })
  return theme.build(blocks, { phrase: SECTION.phrase })
}

let handler = async (m, { conn, usedPrefix = '.' }) => {
  const p = usedPrefix
  try {
    try { await conn.sendMessage(m.chat, { react: { text: SECTION ? SECTION.emoji : '📂', key: m.key } }) } catch {}
    const name = await safeName(conn, m.sender)
    const imageMessage = await getImage(conn)

    const rows = SECTIONS.map(s => ({ title: `${s.emoji} ${s.title}`, description: s.desc, id: `${p}${s.cmd}` }))
    const buttons = [
      { name: 'single_select', buttonParamsJson: JSON.stringify({ title: '📂 الأقـسـام', sections: [{ title: 'اخـتـر الـقـسـم', rows }] }) },
      { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 الـقـنـاة', url: CHANNEL }) },
      { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '👑 الـمـطـوّر', url: `https://wa.me/${DEV}` }) }
    ]

    const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
      body: { text: buildText(name, p) },
      footer: { text: BRAND },
      header: imageMessage
        ? { hasMediaAttachment: true, imageMessage }
        : { hasMediaAttachment: false, title: BRAND },
      nativeFlowMessage: { buttons }
    })
    const msg = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage } } }, { userJid: conn.user.jid, quoted: m })
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  } catch (e) {
    console.error('[menu]', e)
    // احتياط: نفس القائمة كنص عادي برسالة واحدة
    const name = await safeName(conn, m.sender)
    await m.reply(buildText(name, p))
  }
}

handler.help = ['ق11']
handler.tags = ['main']
handler.command = ["ق11", "المطور_اوامر"]
handler.rowner = true

export default handler
