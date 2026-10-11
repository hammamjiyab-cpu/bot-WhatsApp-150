// plugins/kick.js
// ✦ أمر الطرد — موحّد (يدعم الرد والمنشن والرقم) مع حماية المطورين والمشرفين

import { theme } from '../core/theme.js'

// أرقام المطورين (محظور طردهم)
const DEVELOPERS = [...(global.owner || [])]
const digits = (s) => String(s || '').replace(/[^0-9]/g, '')

let handler = async (m, { conn, text, participants = [], usedPrefix = '.', command }) => {
  // الهدف: رد ← منشن ← رقم مكتوب
  let target = m.quoted?.sender || m.mentionedJid?.[0]
  if (!target && text) {
    const n = digits(text)
    if (n.length >= 7 && n.length <= 15) target = `${n}@s.whatsapp.net`
  }

  if (!target) {
    return m.reply(theme.usage('الـطـرد', `${usedPrefix}${command} @منشن`, 'أو رد على رسالة العضو'))
  }

  try { if (conn.convertLidToRealJid) target = (await conn.convertLidToRealJid(target, m.chat)) || target } catch {}

  const num = digits(target)

  if (DEVELOPERS.includes(num) || num === digits(conn.user?.jid)) {
    return m.reply(theme.warning('هذا العضو محميّ ولا يمكن طرده.'))
  }

  const member = participants.find(p => digits(p.id) === num || digits(p.phoneNumber) === num)
  if (!member) return m.reply(theme.warning('هذا الشخص ليس في المجموعة.'))
  if (member.admin) return m.reply(theme.warning('لا يمكن طرد مشرف، أنزل رتبته أولاً.'))

  try {
    await conn.groupParticipantsUpdate(m.chat, [member.phoneNumber || member.id], 'remove')
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
    return conn.sendMessage(m.chat, {
      text: theme.build([
        { type: 'title', text: 'تـمّ الـطـرد' },
        { type: 'divider' },
        { type: 'info', label: 'الـهـدف', value: `@${num}` },
        { type: 'info', label: 'الـمـنـفّـذ', value: `@${digits(m.sender)}` }
      ], { phrase: 'charisma' }),
      mentions: [member.id, m.sender]
    }, { quoted: m })
  } catch (e) {
    return m.reply(theme.error(`تعذّر الطرد: ${e.message || e}`))
  }
}

handler.help = ['kick @user']
handler.tags = ['group']
handler.command = ['kick', 'طرد']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
