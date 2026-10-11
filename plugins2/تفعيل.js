// عكس التشريد (مطور)
const plugin = async ({ send, h }) => {
  await h.delay(2000)
  if (!global.isMuted) {
    await send('ℹ️ وضع التشريد غير مفعّل أصلاً.')
    return
  }
  global.isMuted = false
  h.saveState()
  await send('✅ تم إيقاف وضع التشريد، البوت رجع يشتغل.')
}

plugin.command = /^\.تفعيل$/
plugin.help = '*.تفعيل* — إيقاف وضع التشريد'
plugin.access = 'owner'
plugin.priority = 5

export default plugin
