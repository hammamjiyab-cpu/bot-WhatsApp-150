// تفاعل القروب اليوم
const plugin = async ({ conn, chat, isGroup, send, h }) => {
  if (!isGroup) return
  await h.delay(2000)
  await h.sendStats(conn, chat)
}

plugin.command = /^\.(?:حسبه|حسبة)$/
plugin.help = '*.حسبه* — تفاعل القروب اليوم'
plugin.access = 'elite'
plugin.open = true // يفتح للجميع فقط إذا OPEN_STATS_FOR_ALL = true في handler1.js
plugin.priority = 11

export default plugin
