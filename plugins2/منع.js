const plugin = async ctx => {
  const { send, args, h, chat, owner, elite } = ctx

  // النخبة والمطور فقط
  if (!owner && !elite) return

  const mode = args.join(' ').trim()

  if (mode === 'تشغيل') {
    h.savedState.linkBlocker ??= {}
    h.savedState.linkBlocker[chat] = true
    await send('✅ تم تشغيل مانع الروابط في هذه المحادثة.')
    return
  }

  if (mode === 'إيقاف' || mode === 'ايقاف') {
    h.savedState.linkBlocker ??= {}
    h.savedState.linkBlocker[chat] = false
    await send('⏹️ تم إيقاف مانع الروابط في هذه المحادثة.')
    return
  }

  const enabled = !!h.savedState.linkBlocker?.[chat]

  await send(
    `🛡️ *مانع الروابط*\n\n` +
    `الحالة: ${enabled ? '🟢 يعمل' : '🔴 متوقف'}\n\n` +
    `• .منع رابط تشغيل\n` +
    `• .منع رابط إيقاف\n\n` +
    `يسمح بروابط واتساب ويمنع الروابط الأخرى عند تفعيل الحماية.`
  )
}

plugin.command = /^\.منع رابط(?:\s+(?:تشغيل|إيقاف|ايقاف))?$/
plugin.help = '.منع رابط — تشغيل أو إيقاف مانع الروابط'
plugin.access = 'elite'
plugin.group = true
plugin.priority = 10

export default plugin