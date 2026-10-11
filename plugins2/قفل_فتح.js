// قفل / فتح القروب
const plugin = async ({ conn, chat, isGroup, commandText, send, h }) => {
  await h.delay(2000)

  if (!isGroup) {
    await send('⚠️ الأمر يعمل داخل المجموعات فقط.')
    return
  }

  const lock = commandText === '.قفل'

  try {
    await conn.groupSettingUpdate(chat, lock ? 'announcement' : 'not_announcement')
    await send(lock ? '🔒 تم قفل القروب.' : '🔓 تم فتح القروب.')
  } catch {
    await send('❌ ما قدرت أنفّذ. تأكد إن البوت مشرف.')
  }
}

plugin.command = /^\.(?:قفل|فتح)$/
plugin.help = [
  '*.قفل* — قفل القروب',
  '*.فتح* — فتح القروب'
]
plugin.access = 'elite'
plugin.priority = 10

export default plugin
