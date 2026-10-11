import { loadPlugins2, listPlugins2 } from '../core/plugins2-loader.js'

const plugin = async ({ send, commandText, owner }) => {
  try {
    // تحديث البلوقنات من المجلد قبل بناء القائمة
    await loadPlugins2()

    const developerList = /^\.اوامري$/.test(commandText)
    const commands = []

    for (const [file, p] of listPlugins2()) {
      if (p.disabled || !p.help) continue
      if (file === 'اوامر.js') continue

      // المطور: أوامر المطور فقط
      if (developerList) {
        if (p.access !== 'owner') continue
      } else {
        // النخبة: أوامر النخبة والأوامر العامة
        if (p.access === 'owner') continue
      }

      for (const line of [].concat(p.help)) {
        commands.push(`✧ ${line}`)
      }
    }

    const title = developerList
      ? '👑 『 أوامر المطور 』'
      : '🛡️ 『 أوامر النخبة 』'

    await send(
      `╭━━〔 ${title} 〕━━╮\n\n` +
      (commands.length
        ? commands.join('\n')
        : 'لا توجد أوامر في هذه القائمة.') +
      `\n\n╰━━〔 🍃 كونوها 〕━━╯`
    )
  } catch (err) {
    console.error('خطأ في تحديث قائمة الأوامر:', err)
    await send('❌ تعذر تحديث قائمة الأوامر.')
  }
}

plugin.command = /^\.(?:اوامر|الاوامر|اوامري)$/
plugin.help = [
  '*.اوامر* — أوامر النخبة والعامة',
  '*.اوامري* — أوامر المطور'
]
plugin.access = 'elite'
plugin.priority = 17

export default plugin