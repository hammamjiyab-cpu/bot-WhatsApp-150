// إدارة القروبات (مطور فقط، ومن قروب الإدارة فقط)
//   .قروب              ← قائمة اختيار بكل القروبات اللي فيها البوت
//   .قروب عرض <قروب>   ← المعلومات + زر رابط + زر ارقام
//   .قروب رابط <قروب>  ← الرابط الحالي (أو: ماعندي اشراف)
//   .قروب ارقام <قروب> ← ارقام المتفاعلين (مثل .الارقام) بدون المطرودين/الخارجين
// <قروب> = رقمه في القائمة أو الـ JID (الأزرار تستخدم الـ JID)
import { Button } from '../core/NIXCODE.js'

const ROWS_PER_SECTION = 10
const NAME_MAX = 40

// آخر قائمة انعرضت، عشان نقدر نختار برقم لو الأزرار ما اشتغلت
let lastList = []

const cut = (s, n) => {
  s = String(s || '')
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

async function fetchGroups(conn) {
  const all = await conn.groupFetchAllParticipating()
  return Object.values(all || {})
    .filter(g => g?.id?.endsWith('@g.us'))
    .sort((a, b) => String(a.subject || '').localeCompare(String(b.subject || ''), 'ar'))
}

function resolveTarget(arg, groups) {
  if (!arg) return null
  if (arg.endsWith('@g.us')) return groups.find(g => g.id === arg) || null
  const n = Number(arg)
  if (Number.isInteger(n) && n >= 1 && lastList[n - 1]) {
    return groups.find(g => g.id === lastList[n - 1]) || null
  }
  return null
}

async function sendList({ rawConn, chat, message, send, groups, h }) {
  if (!groups.length) {
    await send('⚠️ البوت مو موجود في أي قروب.')
    return
  }

  lastList = groups.map(g => g.id)

  try {
    const btn = new Button(rawConn)
      .setTitle('📋 القروبات')
      .setSubtitle(`${groups.length} قروب`)
      .setBody('اختر القروب من القائمة عشان تشوف معلوماته')
      .setFooter('للمطور فقط')
      .addSelection('📚 اختر القروب')

    for (let i = 0; i < groups.length; i += ROWS_PER_SECTION) {
      btn.makeSection(`${i + 1} - ${Math.min(i + ROWS_PER_SECTION, groups.length)}`)
      for (const g of groups.slice(i, i + ROWS_PER_SECTION)) {
        const today = h.getTodayStats(g.id).dailyMessages
        btn.makeRow(
          '',
          cut(g.subject || 'بدون اسم', NAME_MAX),
          `👥 ${g.participants?.length ?? 0}  |  💬 ${h.formatCount(today)}`,
          `.قروب عرض ${g.id}`
        )
      }
    }

    await btn.send(chat, { quoted: message })
  } catch (e) {
    console.error('[قروب] فشل إرسال القائمة بالأزرار:', e)
    const lines = groups.map((g, i) => `${i + 1}. ${cut(g.subject || 'بدون اسم', NAME_MAX)} (${g.participants?.length ?? 0})`)
    await h.sendChunked(rawConn, chat, '📋 *القروبات*\nاكتب: *.قروب عرض* [الرقم]', lines)
  }
}

async function sendInfo({ rawConn, chat, message, group, h }) {
  const today = h.getTodayStats(group.id)

  const body =
    `*${group.subject || 'بدون اسم'}*\n\n` +
    `👥 الأعضاء: ${group.participants?.length ?? 0}\n` +
    `💬 *التفاعل* ꧁ ${h.formatCount(today.dailyMessages)} ꧂\n` +
    `+𝟮𝟬𝟬 ☜ *المتفاعلين* 〘${h.formatCount(today.activeUsersOver200)}〙\n` +
    `📋 *المتفاعلين (كامل)* 〘${h.formatCount(today.activeUsersAny)}〙`

  await new Button(rawConn)
    .setTitle('ℹ️ معلومات القروب')
    .setBody(body)
    .setFooter('للمطور فقط')
    .addReply('🔗 رابط', `.قروب رابط ${group.id}`)
    .addReply('📞 ارقام', `.قروب ارقام ${group.id}`)
    .send(chat, { quoted: message })
}

async function sendLink({ rawConn, send, chat, group }) {
  try {
    // يسحب الرابط الحالي بدون ما يغيّره
    const code = await rawConn.groupInviteCode(group.id)
    if (!code) throw new Error('no code')
    await send(`🔗 *${group.subject || ''}*\nhttps://chat.whatsapp.com/${code}`)
  } catch {
    await send(`⚠️ *${group.subject || ''}*\nماعندي اشراف.`)
  }
}

const digits = v => String(v || '').split('@')[0].split(':')[0].replace(/\D/g, '')

// نفس طريقة أمر .الارقام (أرقام المتفاعلين من الإحصائيات) لكن للقروب المختار،
// مع استبعاد اللي خرج أو انطرد من القروب
async function sendNumbers({ conn, rawConn, send, chat, group, h }) {
  try {
    const stats = h.ensureGroupStats(group.id)
    const raw = new Set(Object.keys(stats.activeUsers || {}))

    for (const users of Object.values(stats.dailyUsers || {})) {
      for (const jid of Object.keys(users || {})) raw.add(jid)
    }
    for (const event of h.getPendingEvents(group.id)) {
      if (event.sender) raw.add(event.sender)
    }

    // أعضاء القروب الحاليين (بكل صيغ المعرّف) عشان نستبعد المطرودين
    let members = null
    try {
      const meta = await rawConn.groupMetadata(group.id)
      members = new Set()
      for (const p of meta.participants || []) {
        for (const v of [p.id, p.lid, p.jid, p.phoneNumber]) {
          const d = digits(v)
          if (d) {
            members.add(d)
            members.add(h.canonNumber(v))
          }
        }
      }
    } catch {}

    const numbers = new Set()
    const unresolved = new Set()
    let removed = 0

    for (const jid of raw) {
      let n = h.canonNumber(jid)

      if (String(jid).endsWith('@lid') && n === h.numberFromJid(jid)) {
        const pn = await h.lidToPn(rawConn, jid, group.id)
        if (pn) n = pn
        else {
          unresolved.add(h.numberFromJid(jid))
          continue
        }
      }

      if (!n) continue

      if (members && !members.has(n) && !members.has(digits(jid))) {
        removed++
        continue
      }
      numbers.add(n)
    }

    const list = [...numbers]

    if (!list.length && !unresolved.size) {
      await send('ℹ️ ما فيه أرقام متفاعلة مسجلة لهذا القروب.')
      return
    }

    await h.sendChunked(
      conn,
      chat,
      `📋 *أرقام المتفاعلين في ${group.subject || 'القروب'}: ${list.length}*`,
      list.map((n, i) => `${i + 1}. +${n}`)
    )

    if (removed) await send(`🚪 ${removed} رقم استُبعد (خرج أو انطرد من القروب).`)
    if (unresolved.size) {
      await send(`⚠️ ${unresolved.size} معرّف ما انحل لرقم حقيقي (مو معروف للبوت).`)
    }
  } catch (e) {
    console.error('[قروب/ارقام]', e)
    await send(`❌ خطأ في الأرقام: ${String(e?.message || e).slice(0, 200)}`)
  }
}

const plugin = async ctx => {
  const { conn, rawConn, chat, message, send, args, h } = ctx

  // لازم يكون من قروب الإدارة
  const adminGroup = h.savedState.adminGroup
  if (!adminGroup) {
    await send('⚠️ ما فيه قروب إدارة. اكتب *.اداره* داخل القروب اللي تبيه.')
    return
  }
  if (chat !== adminGroup) return

  let groups
  try {
    groups = await fetchGroups(rawConn)
  } catch {
    await send('❌ ما قدرت أجيب قائمة القروبات.')
    return
  }

  const sub = args[0]

  if (!sub) {
    await sendList({ rawConn, chat, message, send, groups, h })
    return
  }

  const group = resolveTarget(args[1], groups)
  if (!group) {
    await send('⚠️ القروب غير موجود. اكتب *.قروب* عشان تشوف القائمة.')
    return
  }

  const c = { conn, rawConn, chat, message, send, group, h }

  if (sub === 'عرض') return sendInfo(c)
  if (sub === 'رابط') return sendLink(c)
  if (sub === 'ارقام' || sub === 'أرقام') return sendNumbers(c)

  await send('⚠️ استخدم: *.قروب* ثم اختر من القائمة.')
}

plugin.command = /^\.قروب(?: |$)/
plugin.help = '*.قروب* — قائمة القروبات (مطور، من قروب الإدارة)'
plugin.access = 'owner' // غير المطور ما يرد عليه البوت نهائيًا، حتى لو ضغط على الأزرار
plugin.group = true
plugin.priority = 10

export default plugin