/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import fetch from 'node-fetch'

let handler = async (m, { conn, command, args }) => {
    if (!args[0]) {
        return conn.reply(m.chat, '『 هات لينك الصفحه او الموقع معا الامر 🩸 』', m)
    }
    await m.react('🕓')

    try {
        
        let ss = await (await fetch(`https://image.thum.io/get/fullpage/${args[0]}`)).buffer()
        conn.sendFile(m.chat, ss, 'screenshot.png', 'تم يحب  🩸', m)
        await m.react('✅')
    } catch (err) {
        console.error(err) 
        await m.react('✖️')
    }
}

handler.help = ['اسكرين <رابط>']
handler.tags = ['tools']
handler.command = /^سكرين$/i

export default handler