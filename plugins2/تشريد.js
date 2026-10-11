// وضع التشريد (مطور)
const plugin = async ({ send, h }) => {
  await h.delay(2000)
  global.isMuted = true
  h.saveState()
  await send('🤫 تم تفعيل وضع التشريد.')
}

plugin.command = /^\.تشريد$/
plugin.help = '*.تشريد* — وضع التشريد'
plugin.access = 'owner'
plugin.priority = 4

export default plugin
