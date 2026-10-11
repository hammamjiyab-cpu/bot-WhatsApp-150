// plugins/ريستارت.js
// Hammam Bot- إعادة التشغيل التلقائي 🔄

import { theme } from '../core/theme.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // ⬇️ لو كتب الوقت بس - تشغيل التايمر
  if (text && !isNaN(text)) {
    let minutes = parseInt(text)
    if (minutes < 1) minutes = 1
    
    // ⬇️ رسالة تأكيد
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})
    
    // ⬇️ ضبط التايمر
    setTimeout(() => {
      console.log('🔄 إعادة تشغيل تلقائية...')
      process.exit(1) // يقفل البوت - المنصة هتشغله تاني
    }, minutes * 60 * 1000) // تحويل الدقائق لملي ثانية
    
  } else {
    // ⬇️ لو كتب الأمر بس - عرض المساعدة
    return m.reply(theme.build([
      { type: 'title', text: '🔄 "وحدة إعادة التشغيل"' },
      { type: 'divider' },
      { type: 'line', text: '⚔️ *إعادة تشغيل تلقائي للنظام*' },
      { type: 'divider' },
      { type: 'info', label: '🔮 الاستخدام', value: `${usedPrefix + command} <الوقت بالدقائق>` },
      { type: 'spacer' },
      { type: 'info', label: '📌 أمثلة', value: '' },
      { type: 'line', text: `${usedPrefix + command} 30` },
      { type: 'line', text: `${usedPrefix + command} 60` },
      { type: 'line', text: `${usedPrefix + command} 120` },
      { type: 'divider' },
      { type: 'warning', text: `⚡ للإلغاء: ${usedPrefix + command} 0` }
    ]))
  }
}

handler.command = ['ريستارت', 'restart', 'اعاده', 'ريست', 'اعادة_تشغيل']
handler.help = ['ريستارت']
handler.tags = ['owner']
handler.owner = true

export default handler