// دخول/خروج/تفاعل اليوم
const plugin = async ({ chat, isGroup, send, h }) => {
  if (!isGroup) return
  await h.delay(2000)

  const group = h.ensureGroupStats(chat)
  const day = h.todayKey()
  const values = h.getTodayStats(chat)

  await send(
    `📊 *احصاء اليوم* (${day})\n\n` +
    `➕ *دخل:* ${Number(group.dailyJoins?.[day] || 0)}\n` +
    `➖ *خرج:* ${Number(group.dailyLeaves?.[day] || 0)}\n` +
    `💬 *التفاعل:* ${h.formatCount(values.dailyMessages)} رسالة\n` +
    `👥 *عدد المتفاعلين:* ${h.formatCount(values.activeUsersAny)}\n\n` +
    `🕒 ${h.riyadhNowText()} (توقيت الرياض)`
  )
}

plugin.command = /^\.(?:ا|إ)حصاء$/
plugin.help = '*.احصاء* — دخول/خروج/تفاعل اليوم'
plugin.access = 'elite'
plugin.priority = 13

export default plugin
