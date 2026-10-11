/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

let handler = async (m, { conn, isAdmin, isOwner }) => {
  if (!m.isGroup) return m.reply('⚠️ هذا الأمر يعمل فقط في المجموعات.')
  if (!isOwner) return m.reply('🚫 هذا الأمر المطور فقط يا عبد.')
  if (isAdmin) return m.reply('✅ انت ادمن اصلا يا غبي 🤦.')
  await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote')
  await m.reply('🛡️ لقد تمت ترقيتك بواسطة البوت.')
}
handler.command = ['ارفعني', 'ادمني', 'autoadmin']
handler.help = ['ارفعني']
handler.tags = ['owner']
handler.owner = true
handler.botAdmin = true
export default handler