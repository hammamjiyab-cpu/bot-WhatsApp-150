let handler = async (m, { command, isOwner }) => {
    global.disabledChats = global.disabledChats || []
    let chatId = m.chat

    if (command === 'nostg') {
        if (global.disabledChats.includes(chatId)) {
            return m.reply('⚠️ البوت معطل بالفعل في هذه المجموعة!')
        }
        global.disabledChats.push(chatId)
        return m.reply('🚫 تم إيقاف استجابة البوت في هذه المجموعة تماماً.')
    }

    if (command === 'onstg') {
        if (!global.disabledChats.includes(chatId)) {
            return m.reply('⚠️ البوت يعمل بالفعل في هذه المجموعة!')
        }
        global.disabledChats = global.disabledChats.filter(id => id !== chatId)
        return m.reply('✅ تم إعادة تفعيل استجابة البوت في هذه المجموعة.')
    }
}

handler.command = ['nostg', 'onstg']
handler.rowner = true
handler.group = true

export default handler