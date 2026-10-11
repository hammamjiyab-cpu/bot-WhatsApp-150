const plugin = async ctx => {
  const { send, args, h, chat } = ctx
  const mode = args.join(' ').trim()

  h.savedState.linkBlocker ??= {}

  if (mode === 'منع') {
    h.savedState.linkBlocker[chat] = true
    await send('🛡️ تم تفعيل مانع الروابط.')
    return
  }

  if (mode === 'ايقاف منع' || mode === 'إيقاف منع') {
    h.savedState.linkBlocker[chat] = false
    await send('✅ تم إيقاف مانع الروابط.')
    return
  }

  const enabled = !!h.savedState.linkBlocker[chat]

  await send(
    `🛡️ *مانع الروابط*\n\n` +
    `الحالة: ${enabled ? '🟢 يعمل' : '🔴 متوقف'}\n\n` +
    `• .منع — تفعيل المنع\n` +
    `• .ايقاف منع — إيقاف المنع`
  )
}

plugin.command = [
  /^\.منع$/,
  /^\.ايقاف منع$/,
  /^\.إيقاف منع$/,
  /^\.منع رابط$/
]
plugin.help = '.منع | .ايقاف منع'
plugin.access = 'elite'
plugin.group = true
plugin.priority = 10

export default plugin