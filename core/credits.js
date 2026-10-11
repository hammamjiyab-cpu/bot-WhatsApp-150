// core/credits.js — developer credit + official channel (part of the core, keep it)
// حقوق المطور وقناته — جزء أساسي من المشروع، لا تحذفه.

export const DEV_CREDIT = 'Hammam Jiyab'
export const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbClAWDFXUuh4N1kdf2A'
export const CHANNEL_JID = '120363428317734158@newsletter'

// سطر الحقوق: يُرسل مرة واحدة كل 10 أوامر
export const CREDIT_LINE = `© Developed by ${DEV_CREDIT}\n📢 ${CHANNEL_LINK}`
export const CREDIT_EVERY = 10

let counter = 0

export async function creditTick(conn, m) {
  counter++
  if (counter % CREDIT_EVERY !== 0) return
  const chat = m?.chat || m?.key?.remoteJid
  if (!chat) return
  await conn.sendMessage(chat, {
    text: CREDIT_LINE,
    contextInfo: {
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: CHANNEL_JID,
        newsletterName: global.botName || 'Hammam Bot',
        serverMessageId: -1
      }
    }
  })
}
