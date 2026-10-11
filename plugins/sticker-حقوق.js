/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import { addExif } from '../Z/sticker.js'

const handler = async (m, { conn, text }) => {
    try {
        if (!m.quoted) {
            return m.reply(
                `╭──────────────────────╮
│    ✦ Hammam STICKER ✦
├──────────────────────┤
│
│ ❌ قم بالرد على ملصق أولاً.
│
│ مثال:
│ ↳ حقوق
│ ↳ حقوق Hammam
│
╰──────────────────────╯`
            )
        }

        const mime = m.quoted.mimetype || ''

        if (!mime.includes('webp')) {
            return m.reply(
                `╭──────────────────────╮
│    ✦ Hammam STICKER ✦
├──────────────────────┤
│
│ ❌ الرسالة التي رددت عليها
│ ليست ملصق WebP.
│
╰──────────────────────╯`
            )
        }

        const sticker = await m.quoted.download()

        if (!sticker || !Buffer.isBuffer(sticker)) {
            return m.reply('❌ تعذر تحميل الملصق.')
        }

        const botName = global.botname || 'Hammam Bot'
        const dev = global.dev || 'Hammam'

        const author = text?.trim()
            ? `╭──────────────────────╮
│   ${botName}
├──────────────────────┤
│   ${text.trim()}
╰──────────────────────╯`
            : `╭──────────────────────╮
│   ${botName}
├──────────────────────┤
│   ✦ ${dev}
│   ✦Hammam Bot╰──────────────────────╯`

        const result = await addExif(
            sticker,
            botName,
            author
        )

        if (!result || !Buffer.isBuffer(result)) {
            throw new Error('تعذر إنشاء الملصق الجديد.')
        }

        await conn.sendMessage(
            m.chat,
            {
                sticker: result
            },
            {
                quoted: m
            }
        )

    } catch (error) {
        console.error('❌ Hammam Rights Error:', error)

        return m.reply(
            `❌ تعذر إكمال العملية

${error?.message || 'حدث خطأ غير معروف'}`
        )
    }
}

handler.help = ['حقوق <نص>']
handler.tags = ['sticker']
handler.command = ['حقوق', 'rights']

export default handler