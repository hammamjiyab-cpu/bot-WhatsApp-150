// تعيين قروب الإدارة (مطور)
const plugin = async ({ chat, isGroup, send, h }) => {
  await h.delay(2000)

  if (!isGroup) {
    await send('⚠️ الأمر يعمل داخل المجموعات فقط.')
    return
  }

  h.savedState.adminGroup = chat
  h.saveState()
  await send('✅ تم تعيين هذه المجموعة كقروب الإدارة.')
}

plugin.command = /^\.(?:اداره|ادارة)$/
plugin.help = '*.اداره* — تعيين قروب الإدارة'
plugin.access = 'owner'
plugin.priority = 6

export default plugin
