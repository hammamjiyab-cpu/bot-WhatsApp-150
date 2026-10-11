// أرقام كل من تفاعل بالقروب
const plugin = async ({ conn, chat, isGroup, send, h }) => {
  if (!isGroup) return
  await h.delay(2000)

  const group = h.ensureGroupStats(chat)
  const raw = new Set(Object.keys(group.activeUsers || {}))

  for (const users of Object.values(group.dailyUsers || {})) {
    for (const jid of Object.keys(users || {})) raw.add(jid)
  }
  for (const event of h.getPendingEvents(chat)) {
    if (event.sender) raw.add(event.sender)
  }

  const numbers = new Set()
  const unresolved = new Set()

  for (const jid of raw) {
    let n = h.canonNumber(jid)

    if (String(jid).endsWith('@lid') && n === h.numberFromJid(jid)) {
      const pn = await h.lidToPn(conn, jid, chat)
      if (pn) n = pn
      else {
        unresolved.add(h.numberFromJid(jid))
        continue
      }
    }

    if (n) numbers.add(n)
  }

  const list = [...numbers]

  if (!list.length && !unresolved.size) {
    await send('ℹ️ ما فيه أرقام متفاعلة مسجلة لهذا القروب.')
    return
  }

  await h.sendChunked(
    conn,
    chat,
    `📋 *أرقام المتفاعلين في القروب: ${list.length}*`,
    list.map((n, i) => `${i + 1}. +${n}`)
  )

  if (unresolved.size) {
    await send(`⚠️ ${unresolved.size} معرّف ما انحل لرقم حقيقي (مو معروف للبوت).`)
  }
}

plugin.command = /^\.(?:الارقام|الأرقام)$/
plugin.help = '*.الارقام* — أرقام كل من تفاعل بالقروب'
plugin.access = 'elite'
plugin.priority = 14

export default plugin
