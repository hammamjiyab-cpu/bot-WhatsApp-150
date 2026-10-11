// Hammam Bot- أمر الحذف ✧
// مهمة: حذف أي رسالة يتم الرد عليها

import { theme } from '../core/theme.js'

let handler = async (m, { conn, isAdmin, isROwner }) => {
  if (!m.quoted) return m.reply(`❄️ ** "لم أحدد هدفاً للحذف. قم بالرد على الرسالة التي تريد مسحها."`)

  if (m.isGroup && !isAdmin && !isROwner) {
    return m.reply(theme.error(`هذه المهمة تتطلب صلاحيات مشرف.`))
  }

  try {
    const q = m.quoted

    // ── بناء مفتاح الحذف ─────────────────────────────────────────────────
    const deleteKey = {
      remoteJid: m.chat,
      fromMe:    q.fromMe ?? q.isSelf ?? (q.sender === conn.user.jid),
      id:        q.id ?? q.key?.id,
      ...(m.isGroup && { participant: q.sender ?? q.participant ?? q.key?.participant })
    }

    if (!deleteKey.id) {
      console.log('[DEL] مفتاح الهدف غير صالح')
      return
    }

    await conn.sendMessage(m.chat, { delete: deleteKey })
    // Hammam Bot لا ترد على أوامر الحذف - التنفيذ الصامت هو أسلوبها

  } catch (e) {
    console.error('[DEL] فشل الحذف:', e.message)
    m.reply(`❄️ ** "فشلت عملية المسح... الهدف غير موجود أو محمي."`)
  }
}

handler.command = /^(حذف|مسح|delete|del|امسح|امحو)$/i
export default handler