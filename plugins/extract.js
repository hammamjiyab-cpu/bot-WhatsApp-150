// commands/extract.js
// استخراج وتنفيذ الرسالة (نفس نظام Astro Bot)

import { proto, generateWAMessageFromContent, getContentType } from '@whiskeysockets/baileys';

let handler = async (m, { conn, isOwner, usedPrefix = '.' }) => {
    // فقط المطور
    if (!isOwner) return;

    // التأكد من وجود رسالة مقتبسة
    const quoted = m.quoted;
    if (!quoted) {
        return m.reply(`╭━━━❪ *استخراج الرسائل* ❫━━━┈
┃
┃ 📌 *الطريقة الصحيحة:*
┃
┃ 1. اضغط مطولاً على أي رسالة
┃ 2. اختر "رد"
┃ 3. اكتب ${usedPrefix}extract
┃
╰━━━━━━━━━━━━━━━━━━━━┈`);
    }

    await m.react('🕷️');

    try {
        // استخراج محتوى الرسالة المقتبسة
        const targetMsg = quoted.message || quoted;
        const typeMsg = getContentType(targetMsg);
        const contentMsg = JSON.stringify(targetMsg, null, 2);
        const filename = `${typeMsg || "Message"}.json`;

        // الكود الجاهز لإعادة الإرسال
        const rawMsg = `
const {proto, generateWAMessageFromContent} = await import("@whiskeysockets/baileys");

const contentMsg = ${contentMsg};
const webMsg = proto.Message.fromObject(contentMsg);
const waMsg = generateWAMessageFromContent("${m.chat}", webMsg, { userJid: conn.user.jid, quoted: ${JSON.stringify(m, null, 2)} });

await conn.relayMessage("${m.chat}", waMsg.message, { messageId: waMsg.key.id });
`;

        // 1️⃣ إرسال ملف JSON
        await conn.sendMessage(m.chat, {
            document: Buffer.from(contentMsg, 'utf-8'),
            mimetype: 'application/json',
            fileName: filename,
            caption: `📄 *استخراج رسالة*\n📌 نوع: ${typeMsg}\n📅 ${new Date().toLocaleString()}`
        }, { quoted: m });

        // 2️⃣ إرسال الكود الجاهز
        await conn.sendMessage(m.chat, {
            text: `📋 *كود إعادة الإرسال*\n\`\`\`javascript\n${rawMsg}\n\`\`\``
        }, { quoted: m });

        // 3️⃣ 🔥 تنفيذ الرسالة وإعادة إرسالها فوراً (زي نظام Astro Bot)
        const webMsg = proto.Message.fromObject(targetMsg);
        const waMsg = generateWAMessageFromContent(m.chat, webMsg, {
            userJid: conn.user.jid,
            quoted: m
        });

        await conn.relayMessage(m.chat, waMsg.message, {
            messageId: waMsg.key.id
        });

        await m.react('✅');
        await m.reply(`✅ *تم استخراج وتنفيذ الرسالة بنجاح!*\n📌 نوع: ${typeMsg}`);

    } catch (error) {
        console.error(error);
        await m.react('❌');
        await m.reply(`❌ *خطأ:* ${error.message}`);
    }
};

handler.command = /^(extract|استخرج)$/i;
handler.owner = true;

export default handler;