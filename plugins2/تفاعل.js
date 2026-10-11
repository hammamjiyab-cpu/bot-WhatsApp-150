// 📊 إحصائية تفاعل العضو
const plugin = async ({ conn, message, chat, sender, isGroup, commandText, send, h }) => {
  if (!isGroup) return
  await h.delay(1500)

  let target = await h.getTargetJid(conn, message, commandText, chat)
  if (!target) target = sender

  const number = h.canonNumber(target)
  const day = h.todayKey()
  const count = h.dailyCounts(chat, day).get(number) || 0

  await send(
    `╭━━━〔 📊 إحصائية التفاعل 〕━━━╮\n` +
    `\n` +
    `👤 *العضو:* @${number}\n` +
    `💬 *عدد التفاعلات:* ${h.formatCount(count)}\n` +
    `\n` +
    `╰━━━━━━━━━━━━━━━━━━╯`,
    [`${number}@s.whatsapp.net`]
  )
}

plugin.command = /^\.تفاعل(?: |$)/
plugin.help = '*.تفاعل* @منشن/رد — إحصائية تفاعل العضو'
plugin.access = 'elite'
plugin.open = true
plugin.priority = 12

export default plugin