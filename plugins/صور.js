// plugins/صور.js
// Hammam Bot— توليد وتعديل الصور 🎨

import axios from 'axios';
import { tmpdir } from 'os';
import { join } from 'path';
import { createWriteStream, unlinkSync, existsSync, statSync } from 'fs';
import { pipeline } from 'stream/promises';
import { theme } from '../core/theme.js'

const react = async (conn, m, emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
};

// ترجمة للإنجليزية
async function toEnglish(text) {
    try {
        const r = await axios.get(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`,
            { timeout: 8000 }
        );
        return r.data?.[0]?.map(x => x?.[0]).filter(Boolean).join('') || text;
    } catch { return text; }
}

// تحميل الصورة بالطريقة الصحيحة للبوت
async function getImageBuffer(m) {
    const quoted = m.quoted || null;
    const isImgM = m.mtype === 'imageMessage' || m.mtype === 'stickerMessage';
    const isImgQ = quoted?.mtype === 'imageMessage' || quoted?.mtype === 'stickerMessage';
    if (!isImgM && !isImgQ) return null;
    try {
        const target = isImgM ? m : quoted;
        return await target.download();
    } catch { return null; }
}

// تحميل صورة من رابط وإرسالها
async function downloadAndSend(conn, m, url, caption) {
    const path = join(tmpdir(), `2b_${Date.now()}.jpg`);
    try {
        const res = await axios({ method: 'GET', url, responseType: 'stream', timeout: 90000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        await pipeline(res.data, createWriteStream(path));
        const size = statSync(path).size;
        if (size < 3000) throw new Error('الصورة فارغة — جرب وصف مختلف');
        await conn.sendMessage(m.chat, { image: { url: path }, caption }, { quoted: m });
    } finally {
        try { if (existsSync(path)) unlinkSync(path); } catch {}
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {

    const hasImage = !!(m.mtype === 'imageMessage' || m.mtype === 'stickerMessage' ||
        m.quoted?.mtype === 'imageMessage' || m.quoted?.mtype === 'stickerMessage');

    // ━━━━━━━━━━━━━━━━━━━━━━
    // أمر العدل — تعديل صورة
    // ━━━━━━━━━━━━━━━━━━━━━━
    if (command === 'عدل') {
        if (!hasImage) return m.reply(
`> ❄️ *"تعديل الصور"*
>
> 📌 *الطريقة:*
> ١. أرسل صورة أو رد على صورة
> ٢. اكتب: ${usedPrefix}عدل <وصف التعديل>
>
> 💡 *أمثلة:*
> ${usedPrefix}عدل حوّل لرسم أنمي
> ${usedPrefix}عدل اجعل الخلفية فضاء
> ${usedPrefix}عدل أضف إضاءة درامية`
        );

        if (!text) return m.reply('> ⚠️ اكتب وصف التعديل\n> 📌 مثال: .عدل حوّل لأنمي');

        await react(conn, m, '🎨');
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

        try {
            const buffer = await getImageBuffer(m);
            if (!buffer) throw new Error('تعذّر تحميل الصورة، تأكد أنك أرسلت صورة أو رددت على صورة');

            const engPrompt = await toEnglish(text);
            const fullPrompt = `${engPrompt}, ultra high quality, professional photo edit, detailed`;
            const b64 = buffer.toString('base64');

            // Pollinations img2img مع موديل Flux
            const encoded = encodeURIComponent(fullPrompt);
            const imgEncoded = encodeURIComponent(`data:image/jpeg;base64,${b64}`);
            const url = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&enhance=true&image=${imgEncoded}&seed=${Date.now()}`;

            await downloadAndSend(conn, m, url,
`> ✅ *"تم التعديل"*
>
> 📝 *التعديل:* ${text}
> 🎨 *Flux AI*`
            );
            await react(conn, m, '✅');

        } catch (err) {
            await react(conn, m, '❌');
            return m.reply(theme.build([{ type: 'title', text: `❌ فشل التعديل` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message}` }]));
        }
        return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━
    // أمر صور — توليد صورة
    // ━━━━━━━━━━━━━━━━━━━━━━
    if (!text) return m.reply(
`> ❄️ *"توليد الصور - Flux AI"*
>
> 🖼️ *توليد من نص:*
> ${usedPrefix}صور <وصف الصورة>
>
> ✏️ *تعديل صورة:*
> (أرسل/رد على صورة) ثم:
> ${usedPrefix}عدل <وصف التعديل>
>
> 📌 *أمثلة:*
> ${usedPrefix}صور امرأة محاربة في الفضاء
> ${usedPrefix}صور مدينة عربية مستقبلية ليلاً
> ${usedPrefix}صور قطة تجلس على القمر`
    );

    await react(conn, m, '🎨');
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

    try {
        const engText = await toEnglish(text);
        const fullPrompt = `${engText}, ultra high quality, 8k resolution, masterpiece, highly detailed, professional photography`;
        const encoded = encodeURIComponent(fullPrompt);

        // Flux — أعلى جودة مجانية متاحة
        const url = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}`;

        await downloadAndSend(conn, m, url,
`> ✅ *"تم التوليد"*
>
> 📝 *الوصف:* ${text}
> 🎨 *Flux AI*`
        );
        await react(conn, m, '✅');

    } catch (err) {
        await react(conn, m, '❌');
        return m.reply(theme.build([{ type: 'title', text: `❌ فشل التوليد` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message}` }, { type: 'line', text: `💡 جرب وصف مختلف` }]));
    }
};

handler.help = ['صور <وصف>', 'عدل <تعديل>'];
handler.tags = ['ai'];
handler.command = /^(صور|swr|edit)$/i;

export default handler;