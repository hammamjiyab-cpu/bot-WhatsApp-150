// plugins/لغة.js — change the bot language live (developer only)
import { setLang, currentLang } from '../core/lang.js'

let handler = async (m, { text, usedPrefix, command }) => {
  const code = String(text || '').trim()
  if (!code) {
    return m.reply(
      `🌐 اللغة الحالية: ${currentLang()}\n\n` +
      `الاستخدام: ${usedPrefix}${command} en\n` +
      `أمثلة: ar عربي · en English · fr · es · tr · de · ru · id · hi · ur`
    )
  }
  if (!setLang(code)) return m.reply('❌ رمز لغة غير صحيح. مثال: en')
  return m.reply(`✅ تم تغيير لغة البوت إلى: ${currentLang()}`)
}

handler.help = ['لغة <code>']
handler.tags = ['owner']
handler.command = ['لغة', 'lang', 'language']
handler.rowner = true

export default handler
