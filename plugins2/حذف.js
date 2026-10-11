const plugin = async ({
  conn,
  chat,
  sender,
  message,
  isGroup,
  owner,
  send,
  h
}) => {
  await h.delay(1000)

  // استخراج سياق الرسالة التي تم الرد عليها
  function unwrapMessage(content) {
    while (content && typeof content === 'object') {
      const next =
        content.ephemeralMessage?.message ||
        content.viewOnceMessage?.message ||
        content.viewOnceMessageV2?.message ||
        content.viewOnceMessageV2Extension?.message ||
        content.documentWithCaptionMessage?.message

      if (!next) break
      content = next
    }

    return content || {}
  }

  const content = unwrapMessage(message?.message)

  const contextInfo = Object.values(content).find(
    value =>
      value &&
      typeof value === 'object' &&
      value.contextInfo
  )?.contextInfo

  const messageId = contextInfo?.stanzaId
  const participant = contextInfo?.participant

  if (!messageId) {
    await send(
      '❄️ ** لم أحدد رسالة للحذف. قم بالرد على الرسالة التي تريد حذفها.'
    )
    return
  }

  // التحقق من صلاحية المستخدم داخل المجموعة
  if (isGroup && !owner) {
    try {
      const metadata = await conn.groupMetadata(chat)

      const callerIds = [
        sender,
        message?.key?.participant,
        message?.key?.participantAlt,
        message?.key?.participantPn
      ]
        .filter(Boolean)
        .map(String)

      const isAdmin = (metadata.participants || []).some(p => {
        if (p.admin !== 'admin' && p.admin !== 'superadmin') {
          return false
        }

        const ids = [
          p.id,
          p.phoneNumber,
          p.jid,
          p.lid
        ]
          .filter(Boolean)
          .map(String)

        return ids.some(id => callerIds.includes(id))
      })

      if (!isAdmin) {
        await send('⚠️ هذا الأمر يتطلب صلاحيات مشرف.')
        return
      }
    } catch {
      await send('❌ تعذر التحقق من صلاحياتك داخل المجموعة.')
      return
    }
  }

  try {
    const botIds = [
      conn.user?.id,
      conn.user?.jid,
      conn.user?.lid
    ].filter(Boolean).map(String)

    const fromMe = Boolean(
      participant && botIds.includes(String(participant))
    )

    const deleteKey = {
      remoteJid: chat,
      fromMe,
      id: messageId,
      ...(isGroup && participant ? { participant } : {})
    }

    await conn.sendMessage(chat, {
      delete: deleteKey
    })
  } catch (error) {
    console.error('[DEL] فشل الحذف:', error)

    await send(
      '❄️ ** فشل حذف الرسالة. تأكد من صلاحيات البوت وحاول مجددًا.'
    )
  }
}

plugin.command = /^\.(?:حذف|مسح|delete|del|امسح|امحو)$/i

plugin.help = [
  '*.حذف* — حذف الرسالة التي ترد عليها',
  '*.مسح* — حذف الرسالة التي ترد عليها'
]

plugin.access = 'all'
plugin.priority = 10

export default plugin