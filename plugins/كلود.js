// plugins/claude.js
// Hammam Bot— كلود Claude 🤖

import { askOverChat, downloadMedia } from './ai-helper.js';
import { theme } from '../core/theme.js'

// إدارة المحادثات لكل مستخدم
const conversations = new Map();

// نظام التعليمات الخاص بـ Claude
const SYSTEM_PROMPT = `أنت Claude، مساعد ذكي متعدد المهارات من Anthropic.
شخصيتك:
- ودود ومتعاون وتحب تساعد
- بتشرح بطريقة بسيطة ومفهومة
- بتستخدم إيموجي عشان الكلام يبقى حيوي
- بترد بالعربي إلا لو حد كلمك بلغة تانية
- ردودك منظمة وواضحة
- اسمك Claude وانت جزء من بوتHammam Bot`;

let handler = async (m, { conn, text, command }) => {
    try {
        // استخراج الصورة من الرسالة
        const imageBase64 = await downloadMedia(m);
        const hasImage = !!imageBase64;
        
        // السؤال هو النص المرسل
        let question = text;
        
        // لو فيه صورة ومافيش سؤال
        if (hasImage && !question) {
            question = "حلل هذه الصورة واشرح لي ماذا يوجد فيها بالتفصيل بالعربية";
        }
        
        // التحقق من وجود سؤال
        if (!question && !hasImage) {
            return m.reply(theme.build([{ type: 'title', text: `وحدة Claude` }, { type: 'divider' }, { type: 'line', text: `🤖 *الاستخدام:* .كلود <سؤالك>` }, { type: 'line', text: `🖼️ *مع صورة:* أرسل الصورة مع نص أو رد على صورة` }, { type: 'line', text: `📌 *مثال:* .كلود اشرح لي الذكاء الاصطناعي` }]));
        }

        await conn.sendMessage(m.chat, { react: { text: hasImage ? '🖼️' : '🧠', key: m.key } });
        
        const statusMsg = hasImage 
            ? theme.build([{ type: 'title', text: `🖼️ Claude يحلل الصورة...` }])
            : theme.build([{ type: 'title', text: `🧠 Claude يفكر...` }]);

        // تحضير السؤال مع الصورة إن وجدت
        let finalPrompt = question;
        if (hasImage && imageBase64) {
            finalPrompt = `[الصورة مرفقة بصيغة Base64]\n${question}`;
        }
        
        // جلب تاريخ المحادثة (آخر 10 رسائل)
        let history = conversations.get(m.sender) || [];
        let context = '';
        if (history.length > 0) {
            context = history.map(h => `${h.role === 'user' ? 'المستخدم' : 'Claude'}: ${h.content}`).join('\n\n') + '\n\n';
        }
        
        const fullPrompt = context + finalPrompt;
        
        // استخدام askOverChat من الملف المساعد
        const response = await askOverChat(fullPrompt, SYSTEM_PROMPT, 'anthropic/claude-opus-4-6');
        
        if (!response) {
            throw new Error('لم يتم الحصول على رد');
        }
        
        // حفظ تاريخ المحادثة
        history.push({ role: "user", content: question });
        history.push({ role: "assistant", content: response });
        if (history.length > 20) {
            history = history.slice(-20);
        }
        conversations.set(m.sender, history);
        
        // تنظيف الرد
        let cleanResponse = response
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/\n\n/g, '\n')
            .trim();
        
        const headerText = hasImage ? 'Claude (تحليل الصور)' : 'Claude';
        
        // تقسيم الرد الطويل
        const maxLength = 4096;
        if (cleanResponse.length > maxLength) {
            const parts = cleanResponse.match(new RegExp(`.{1,${maxLength}}`, 'g'));
            for (let i = 0; i < parts.length; i++) {
                const prefix = i === 0 ? '' : '(تابع) ';
                await conn.sendMessage(m.chat, {
                    text: theme.build([{ type: 'title', text: `${headerText}` }, { type: 'divider' }, { type: 'line', text: `💬 *سؤالك:* ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}` }, { type: 'line', text: `📝 *الرد:* ${prefix}` }, { type: 'line', text: `${parts[i]}` }])
                }, { quoted: m });
            }
        } else {
            await conn.sendMessage(m.chat, {
                text: theme.build([{ type: 'title', text: `${headerText}` }, { type: 'divider' }, { type: 'line', text: `💬 *سؤالك:* ${question}` }, { type: 'line', text: `📝 *الرد:*` }, { type: 'line', text: `${cleanResponse}` }])
            }, { quoted: m });
        }
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error('[Claude]', e);
        await m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🤖 ${e.message || 'حدث خطأ في Claude'}` }, { type: 'line', text: `🔮 حاول مرة أخرى لاحقاً` }]));
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}

handler.help = ['كلود <سؤال>'];
handler.command = ['كلود', 'claude', 'Claude'];
handler.tags = ['ai'];

export default handler;