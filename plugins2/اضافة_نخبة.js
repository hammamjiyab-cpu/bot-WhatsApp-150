// إضافة نخبة (مطور): .اضافه نخبه / .اضافة نخبة / .نخبة / .نخبه
const plugin = async ({ conn, message, chat, commandText, send, h }) => {
  await h.delay(2000)

  const target = await h.getTargetJid(conn, message, commandText, chat)

  if (!target) {
    await send('⚠️ منشن الشخص أو رد على رسالته أو اكتب رقمه بعد الأمر.')
    return
  }

  if (target.endsWith('@lid')) {
    await send('⚠️ ما قدرت أحوّل المعرّف لرقم حقيقي. اكتب الرقم مباشرة بعد الأمر.')
    return
  }

  h.removeEliteIdentity(target)
  global.eliteUsers.add(h.normalizeJid(target))
  h.saveElite()

  await send(`✅ تم إضافة @${h.numberFromJid(target)} إلى النخبة.`, [target])
}

plugin.command = /^\.(?:(?:ا|إ|أ)ضاف[ةه] ?)?نخب[ةه](?![\u0621-\u064A])/
plugin.help = '*.اضافه نخبه* @منشن/رقم — إضافة نخبة'
plugin.access = 'owner'
plugin.priority = 1

export default plugin
