// plugins/bot.js
// ♡ Raiden Shogun - Plane of Euthymia - Bot Info 🔘

import { ButtonV2 } from '../core/NIXCODE.js'
import fetch from 'node-fetch'

const imageUrl = 'https://file.garden/aopbTIvyBCZ1OfsC/IMG-20260819-WA0173.jpg'
let cachedImageBuffer = null

let handler = async (m, { conn }) => {

    if (!cachedImageBuffer) {
        try {
            const res = await fetch(imageUrl)
            cachedImageBuffer = await res.buffer()
        } catch (e) {
            console.error('Failed to cache image:', e)
        }
    }

    await new ButtonV2(conn)
        .setBody(global.botName)
        .setFooter(global.watermark)
        .setThumbnail(cachedImageBuffer || imageUrl)
        .addButton('📂 الـقـائـمـة', 'اوامر') // بدون نقطة لتتولى المكتبة إضافتها تلقائياً
        .addButton('👑 الـمـطـور', 'مطور')   // بدون نقطة ليعمل أمر المطور فوراً
        .send(m.chat)

}

handler.customPrefix = /^(\.)?(بوت|bot)$/i
handler.command = new RegExp()

export default handler