// سحب نخبة (مطور)
const plugin = async ({ conn, message, chat, commandText, send, h }) => {
  await h.delay(2000)

  const target = await h.getTargetJid(conn, message, commandText, chat)

  if (!target) {
    await send('⚠️ منشن الشخص أو رد على رسالته أو اكتب رقمه بعد الأمر.')
    return
  }

  const number = h.canonNumber(target)
  const wasElite = [...global.eliteUsers].some(saved => h.canonNumber(saved) === number)

  h.removeEliteIdentity(target)
  h.saveElite()

  const mention = `${number}@s.whatsapp.net`

  await send(
    wasElite
      ? `🗑️ تم سحب @${number} من النخبة.`
      : `ℹ️ @${number} أصلًا مو من النخبة.`,
    [mention]
  )
}

plugin.command = /^\.سحب ?نخب[ةه]/
plugin.help = '*.سحب نخبه* @منشن/رقم — سحب نخبة'
plugin.access = 'owner'
plugin.priority = 2 // لازم قبل رفع_سحب عشان ".سحب نخبه" ما يتحول لسحب إشراف

export default plugin
