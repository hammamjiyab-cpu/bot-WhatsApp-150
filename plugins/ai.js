// commands/ai.js — مُحدَّث على Groq Llama 3.3 70B
import axios from 'axios';
import { theme } from '../core/theme.js';

const GROQ_KEY = process.env.GROQ_API_KEY || '';
const MODEL   = 'openai/gpt-oss-120b';

const SYSTEM = `أنت مساعد ذكي قوي اسمك Hammam Bot، مدمج في بوت واتساب.
- ذكي وسريع ومباشر، ما تتلعثم ولا تعيد نفسك
- تتكلم عربي مفهوم مع عامية خفيفة لو الشخص يستخدمها
- تجاوب بشكل منظم ومفيد بدون حشو أو مقدمات فاضية
- لو السؤال برمجة: أعطِ كود نظيف مع شرح
- ما تقول أبداً "لا أستطيع" — حاول دائمًا تساعد`;

// ذاكرة المحادثة لكل مستخدم
const memory = new Map();

async function askGroq(messages) {
    const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model: MODEL, messages, max_tokens: 4096, temperature: 0.7 },
        {
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        }
    );
    return res.data?.choices?.[0]?.message?.content || '';
}

let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (!text) {
        return m.reply(theme.build([
            { type: 'title',    text: '🧠 الذكاء الاصطناعي - Llama 3.3 70B' },
            { type: 'spacer' },
            { type: 'info',     label: 'الاستخدام', value: `${usedPrefix}${command} سؤالك` },
            { type: 'info',     label: 'مسح الذاكرة', value: `${usedPrefix}${command} مسح` },
            { type: 'divider' }
        ]));
    }

    // مسح الذاكرة
    if (text.trim() === 'مسح' || text.trim() === 'clear') {
        memory.delete(m.sender);
        return m.reply(theme.build([{ type: 'title', text: `✅ تم مسح الذاكرة` }, { type: 'divider' }, { type: 'line', text: `🧠 محادثة جديدة من الصفر` }]));
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: '🧠', key: m.key } });

        // بناء الرسائل مع الذاكرة
        let history = memory.get(m.sender) || [];
        const messages = [
            { role: 'system',    content: SYSTEM },
            ...history,
            { role: 'user',      content: text }
        ];

        const reply = await askGroq(messages);
        if (!reply) throw new Error('ما وصل رد من Groq');

        // حفظ الذاكرة (آخر 10 تبادلات)
        history.push({ role: 'user',      content: text });
        history.push({ role: 'assistant', content: reply });
        if (history.length > 20) history = history.slice(-20);
        memory.set(m.sender, history);

        // إرسال الرد
        const header = theme.build([{ type: 'title', text: `Llama 3.3 70B` }]);
        const maxLen = 3800;

        if (reply.length <= maxLen) {
            await conn.sendMessage(m.chat, { text: header + reply }, { quoted: m });
        } else {
            const parts = reply.match(new RegExp(`.{1,${maxLen}}`, 'gs')) || [reply];
            for (let i = 0; i < parts.length; i++) {
                await conn.sendMessage(m.chat, {
                    text: i === 0 ? header + parts[i] : `> (تابع)\n> \n` + parts[i]
                }, { quoted: m });
            }
        }

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error('[Groq]', err.message);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(theme.build([{ type: 'title', text: `❌ خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message || 'حدث خطأ، حاول مرة ثانية'}` }]));
    }
};

handler.help = ['ai <سؤال>', 'ذكاء <سؤال>'];
handler.tags = ['ai'];
handler.command = /^(ai|deepai|اسال|ذكاء)$/i;

export default handler;