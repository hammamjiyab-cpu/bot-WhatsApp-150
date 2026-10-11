let handler = async (m, { conn, isAdmin, isROwner, isOwner }) => {
  if (!m.isGroup) return m.reply(`🜲⃝☠️ *خطأ* ☠️⃝🜲\n👁️⃝🩸 للمجموعات فقط`)
  if (!isAdmin && !isROwner && !isOwner) return m.reply(`🜲⃝☠️ *خطأ* ☠️⃝🜲\n👁️⃝🩸 للأدمن فقط`)

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  global.db.data.chats[m.chat].alexAI = !global.db.data.chats[m.chat].alexAI
  
  await conn.sendMessage(m.chat, { text: global.db.data.chats[m.chat].alexAI 
    ? `🜲⃝☠️ *تم تفعيل اليكس* ☠️⃝🜲\n👁️⃝🩸 جندي النخبة جاهز\n𖤐⃝🩸 ${global.botName}`
    : `🜲⃝☠️ *تم إيقاف اليكس* ☠️⃝🜲\n𖤐⃝🩸 ${global.botName}` 
  }, { quoted: m })
}
handler.command = /^(اليكس|alex)$/i
handler.group = true
export default handler