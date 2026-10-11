// غير المتفاعلين اليوم
const plugin = async ({ conn, chat, isGroup, h }) => {
  if (!isGroup) return
  await h.delay(2000)
  await h.sendInactive(conn, chat)
}

plugin.command = /^\.الميتين$/
plugin.help = '*.الميتين* — غير المتفاعلين اليوم'
plugin.access = 'elite'
plugin.priority = 15

export default plugin
