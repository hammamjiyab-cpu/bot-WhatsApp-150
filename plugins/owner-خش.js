/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import fetch from "node-fetch"

let handler = async (m, { conn, text }) => {
  let link = text ? text.trim() : (m.quoted && m.quoted.text ? m.quoted.text.trim() : "")

  if (!link)
    return m.reply("⟢ اكتب رابط الجروب يا زعيم أو اعمل ريبلاي على الرابط 🪄")

  let match = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/)

  if (!match)
    return m.reply("⟢ الرابط ده مش رابط جروب واتساب صالح ❌")

  let inviteCode = match[1]

  try {
    const res = await conn.groupAcceptInvite(inviteCode)

    if (res) {
      await conn.sendMessage(m.chat, {
        react: {
          text: "✅",
          key: m.key
        }
      })

      await m.reply(
        `╭━━━〔Hammam Bot〕━━━╮
┃
┃  ✦ تم الدخول للجروب بنجاح
┃
┃  🔗 الرابط:
┃  ${link}
┃
╰━━━━━━━━━━━━━━━━╯`
      )
    } else {
      await conn.sendMessage(m.chat, {
        react: {
          text: "🕓",
          key: m.key
        }
      })

      await m.reply(
        `╭━━━〔Hammam Bot〕━━━╮
┃
┃  ✦ تعذر الدخول المباشر
┃  ✦ تم إرسال طلب انضمام
┃
┃  🔗 الرابط:
┃  ${link}
┃
╰━━━━━━━━━━━━━━━━╯`
      )
    }

  } catch (err) {
    console.log("❌ خطأ أثناء الدخول:", err)

    await m.reply(
      `╭━━━〔Hammam Bot〕━━━╮
┃
┃  ✦ فشل الدخول للجروب
┃
┃  ❌ قد يكون الرابط منتهي
┃  ❌ أو البوت غير قادر على الانضمام
┃
╰━━━━━━━━━━━━━━━━╯`
    )
  }
}

handler.help = ["خش <لينك>"]
handler.tags = ["owner"]
handler.command = /^خش$/i
handler.owner = true

export default handler