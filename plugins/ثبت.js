// plugins/pin.js
// ✧ Hammam Bot - Pin Message 📌

import { 
    generateWAMessageFromContent, 
    generateMessageIDV2,
    proto
} from '@whiskeysockets/baileys'

let handler = async (m, { conn, isAdmin, isBotAdmin }) => {

    if (!m.isGroup)  return m.reply('❌┇هذا الأمر يعمل داخل المجموعات فقط.')
    if (!m.quoted)   return m.reply('📌┇قم بالرد على الرسالة التي تريد تثبيتها.')
    if (!isAdmin)    return m.reply('❌┇هذا الأمر للمشرفين فقط.')
    if (!isBotAdmin) return m.reply('❌┇يجب أن يكون البوت مشرفًا.')

    try {
        const q = m.quoted
        if (!q.id) return m.reply('❌┇لم أستطع تحديد الرسالة.')

        const key = {
            remoteJid: m.chat,
            fromMe: Boolean(q.fromMe),
            id: q.id,
            participant: q.sender
        }

        // ✅ الطريقة الصحيحة — proto pinInChatMessage
        const pinMsg = generateWAMessageFromContent(m.chat, {
            pinInChatMessage: {
                key,
                type: proto.Message.PinInChatMessage.Type.PIN_FOR_ALL,
                senderTimestampMs: Date.now()
            }
        }, {
            userJid: conn.user.id,
            messageId: generateMessageIDV2(conn.user.id)
        })

        await conn.relayMessage(m.chat, pinMsg.message, { 
            messageId: pinMsg.key.id 
        })

        await m.reply('📌┇تم تثبيت الرسالة بنجاح.')

    } catch (err) {
        console.error('[PIN ERROR]', err)
        await m.reply(`❌┇فشل تثبيت الرسالة.\n⚠️ ${err?.message || 'خطأ غير معروف'}`)
    }
}

handler.help     = ['ثبت', 'تثبيت']
handler.tags     = ['group']
handler.command  = /^(ثبت|تثبيت)$/i
handler.group    = true
handler.admin    = true
handler.botAdmin = true

export default handler