// رفع / سحب إشراف (مطور فقط)
const plugin = async ({ conn, message, chat, isGroup, commandText, send, h }) => {
  await h.delay(2000)

  if (!isGroup) {
    await send('⚠️ الأمر يعمل داخل المجموعات فقط.')
    return
  }

  const action = commandText.startsWith('.رفع') ? 'promote' : 'demote'
  const target = await h.getTargetJid(conn, message, commandText, chat)

  if (!target) {
    await send('⚠️ منشن العضو أو رد على رسالته أو اكتب رقمه.')
    return
  }

  const member = await h.findGroupMember(conn, chat, target)

  if (!member) {
    await send('❌ العضو مو موجود بالقروب.')
    return
  }

  const number = h.canonNumber(member.phoneNumber || member.id)
  const mention = `${number}@s.whatsapp.net`

  try {
    const res = await conn.groupParticipantsUpdate(chat, [member.id], action)
    const status = String(res?.[0]?.status || '200')

    if (!status.startsWith('2')) {
      await send('❌ ما قدرت أنفّذ. تأكد إن البوت مشرف.')
      return
    }

    h.groupMetaCache.delete(chat)
    h.groupAdminCache.delete(chat)

    await send(
      action === 'promote'
        ? `⬆️ تم رفع @${number} مشرف.`
        : `⬇️ تم سحب الإشراف من @${number}.`,
      [mention]
    )
  } catch {
    await send('❌ ما قدرت أنفّذ. تأكد إن البوت مشرف.')
  }
}

plugin.command = /^\.(رفع|سحب)(?: |$)/
plugin.help = [
  '*.رفع* @منشن/رد — رفع إشراف',
  '*.سحب* @منشن/رد — سحب إشراف'
]
plugin.access = 'owner'
plugin.priority = 3

export default plugin
