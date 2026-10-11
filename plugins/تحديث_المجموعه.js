// plugins/detect.js
// Hammam Bot- كشف تغييرات المجموعة 🔍

import { WAMessageStubType } from '@whiskeysockets/baileys'
import { theme } from '../core/theme.js'

export async function before(m, { conn }) {
  if (!m.isGroup || !m.messageStubType) return

  let chat = global.db.data.chats[m.chat]
  if (!chat?.detect) return

  const senderJid = m.sender
  const senderId = senderJid.split('@')[0]
  const usuario = `@${senderId}`
  const pushName = m.pushName || 'User'

  // التوثيق
  const fk = {
    key: {
      participant: senderJid,
      remoteJid: 'status@broadcast'
    },
    message: {
      contactMessage: {
        displayName: 'Hammam Bot',
        vcard: `BEGIN:VCARD
VERSION:3.0
FN:${pushName}
TEL;waid=${senderId}:${senderId}
END:VCARD`
      }
    }
  }

  // ========== ✨ استخراج الرقم النظيف من messageStubParameters ==========
  let rawParam = m.messageStubParameters?.[0] || ''
  let targetId = ''
  
  if (rawParam) {
    const cleanJid = await conn.convertLidToRealJid(rawParam, m.chat)
    targetId = cleanJid ? cleanJid.replace(/@s\.whatsapp\.net|@lid/g, '').replace(/[^0-9]/g, '') : ''
  }

  let nombre = theme.build([
    { type: 'title', text: '📝 تـغـيـر اسـم الـمـجـمـوعـة' },
    { type: 'divider' },
    { type: 'info', label: '👤 بواسطة', value: usuario },
    { type: 'info', label: '🆕 الاسم الجديد', value: m.messageStubParameters?.[0] || '-' }
  ])

  let foto = theme.build([
    { type: 'title', text: '🖼️ تـغـيـر صـورة الـمـجـمـوعـة' },
    { type: 'divider' },
    { type: 'info', label: '👤 بواسطة', value: usuario }
  ])

  let edit = theme.build([
    { type: 'title', text: '⚙️ تـغـيـر إعـدادات الـمـجـمـوعـة' },
    { type: 'divider' },
    { type: 'info', label: '👤 بواسطة', value: usuario }
  ])

  let status = theme.build([
    { type: 'title', text: '🔒 تـغـيـر وضـع الـمـجـمـوعـة' },
    { type: 'divider' },
    { type: 'info', label: '👤 بواسطة', value: usuario }
  ])

  let admingp = theme.build([
    { type: 'title', text: '👑 تـرقـيـة عـضـو' },
    { type: 'divider' },
    { type: 'info', label: '👤 العضو', value: '@' + targetId },
    { type: 'info', label: '👑 بواسطة', value: usuario }
  ])

  let noadmingp = theme.build([
    { type: 'title', text: '📉 إعـفـاء عـضـو' },
    { type: 'divider' },
    { type: 'info', label: '👤 العضو', value: '@' + targetId },
    { type: 'info', label: '👑 بواسطة', value: usuario }
  ])

  let text = null
  let mentions = [senderJid]

  switch (m.messageStubType) {
    case WAMessageStubType.GROUP_CHANGE_SUBJECT:
      text = nombre
      break
    case WAMessageStubType.GROUP_CHANGE_ICON:
      text = foto
      break
    case WAMessageStubType.GROUP_CHANGE_SETTINGS:
      text = edit
      break
    case WAMessageStubType.GROUP_CHANGE_ANNOUNCE:
      text = status
      break
    case WAMessageStubType.GROUP_PARTICIPANT_PROMOTE:
      text = admingp
      if (targetId) mentions.push(targetId + '@s.whatsapp.net')
      break
    case WAMessageStubType.GROUP_PARTICIPANT_DEMOTE:
      text = noadmingp
      if (targetId) mentions.push(targetId + '@s.whatsapp.net')
      break
    default:
      return
  }

  await conn.sendMessage(
    m.chat,
    { text, mentions },
    { quoted: fk }
  )
}