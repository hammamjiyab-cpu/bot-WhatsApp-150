// plugins/ai-analyze.js
// Hammam Bot- تحليل الكود بالذكاء الاصطناعي 🤖

import fs from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import axios from 'axios'
import { theme } from '../core/theme.js'

// مفتاح API بتاعك
const GROQ_KEY = process.env.GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-120b'

let handler = async (m, { conn, usedPrefix, command }) => {
    const react = async (emoji) => {
        try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
    }

    if (!m.quoted) {
        await react('❌')
        return m.reply(theme.build([
            { type: 'title', text: '🤖 "وحدة تحليل الكود"' },
            { type: 'divider' },
            { type: 'line', text: '🔮 *تحليل الكود بالذكاء الاصطناعي*' },
            { type: 'divider' },
            { type: 'info', label: '⚔️ الاستخدام', value: '' },
            { type: 'line', text: '• رد على رسالة فيها كود JavaScript' },
            { type: 'line', text: `• اكتب: ${usedPrefix + command}` },
            { type: 'divider' },
            { type: 'info', label: '🛡️ المميزات', value: '' },
            { type: 'line', text: '• تحليل ذكي للأخطاء' },
            { type: 'line', text: '• اقتراحات للإصلاح' },
            { type: 'line', text: '• شرح المشاكل بالعربية' }
        ]))
    }

    let code = m.quoted.text || ''
    if (!code) {
        await react('❌')
        return m.reply(theme.build([
            { type: 'title', text: '❄️ "خطأ"' },
            { type: 'warning', text: 'لا يوجد كود في الرسالة المقتبسة' }
        ]))
    }

    // تنظيف الكود
    code = code.replace(/```js/g, '').replace(/```javascript/g, '').replace(/```/g, '').trim()

    if (code.length < 5) {
        await react('❌')
        return m.reply(theme.build([
            { type: 'title', text: '❄️ "خطأ"' },
            { type: 'warning', text: 'الكود قصير جداً أو غير صالح' }
        ]))
    }

    await react('🤖')
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

    try {
        // تحليل الكود باستخدام Gemini AI
        const prompt = `أنت خبير في تحليل كود JavaScript. حلل الكود التالي وأخبرني:

1. هل يوجد أخطاء نحوية (Syntax Errors)؟ إذا وجد، اذكرها واشرحها.
2. هل يوجد أخطاء منطقية أو أخطاء محتملة أثناء التشغيل (Runtime Errors)؟
3. اقتراحات لتحسين الكود (إن وجدت).
4. شرح مبسط للكود.

الكود:
\`\`\`javascript
${code}
\`\`\`

أجب باللغة العربية، بشكل مختصر ومفيد.`

        const response = await axios.post(
            GROQ_URL,
            { model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0.3 },
            { timeout: 60000, headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
        )

        const analysis = String(response.data?.choices?.[0]?.message?.content || 'لم يتم الحصول على تحليل').slice(0, 3000)

        await react('✅')

        // رسالة واحدة: الكود + نتيجة التحليل
        const snippet = code.length > 200 ? code.slice(0, 200) + '...' : code
        const resultMsg = theme.build([
            { type: 'title', text: 'تـقـريـر تـحـلـيـل الـكـود' },
            { type: 'divider' },
            { type: 'subtitle', text: 'الكود المرسل' },
            { type: 'line', text: '```js\n' + snippet + '\n```' },
            { type: 'divider' },
            { type: 'subtitle', text: 'نتيجة التحليل' },
            { type: 'line', text: analysis }
        ], { phrase: 'charisma' })

        await m.reply(resultMsg)

    } catch (err) {
        await react('❌')
        console.error('[AI] Error:', err)
        m.reply(theme.build([
            { type: 'title', text: '❄️ "فشل تحليل AI"' },
            { type: 'warning', text: err.message || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي' },
            { type: 'divider' },
            { type: 'line', text: '💡 جرب مرة أخرى أو تحقق من المفتاح' }
        ]))
    }
}

handler.help = ['تحليل']
handler.tags = ['ai']
handler.command = /^(تحليل|analyze)$/i

export default handler