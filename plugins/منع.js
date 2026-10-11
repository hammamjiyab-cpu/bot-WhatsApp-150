// plugins/anti-badwords.js
// Hammam Bot— مانع السب الذكي والمُشفّر 🛡️🔥

import { theme } from '../core/theme.js';

// 📚 الكلمات المحظورة الافتراضية
const defaultBadWords = ["انيك", "كسمك", "طيز", "عرص", "شرطوط"];

// 🛠️ دالة تنظيف وتفكيك تشفير الكلمات للمقارنة
function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
        .replace(/[^\w\s\u0600-\u06FF]/gi, '') // إزالة الرموز والأرقام
        .replace(/(.)\1+/gu, '$1') // إزالة التكرار (اننييككك -> انيك)
        .trim();
}

// 🔐 دالة تشفير الكلمة المكتشفة بوضع رموز عشوائية بين الحروف
function maskWord(word) {
    if (!word) return '***';
    const symbols = ['٪', '﷼', '$', '-', '+', '#', '*'];
    return word.split('').map((char, index) => {
        if (index === word.length - 1) return char;
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        return char + randomSymbol;
    }).join('');
}

let handler = async (m, { conn, text, command, isROwner }) => {
    // إعداد ذاكرة الكلمات المحظورة
    if (!global.db.data) global.db.data = {};
    if (!global.db.data.badwords) global.db.data.badwords = [...defaultBadWords];
    let badwords = global.db.data.badwords;

    // 🚩 1. أمر إضافة كلمات للمنع (.منع)
    if (command === 'منع') {
        if (!isROwner) return m.reply(theme.build([{ type: 'title', text: `تنبيه` }, { type: 'divider' }, { type: 'warning', text: `❌ هذا الأمر مخصص لمطور البوت فقط!` }]));
        if (!text) return m.reply('> 📌 *طريقة الاستخدام:*\n> `.منع أحويك`\n> أو منع مجموعة كلمات بـ (_):\n> `.منع كلب_حيوان_ثور`');

        const wordsToAdd = text.split('_').map(w => normalizeText(w)).filter(w => w.length > 0);
        let added = [];

        for (const word of wordsToAdd) {
            if (!badwords.includes(word)) {
                badwords.push(word);
                added.push(word);
            }
        }

        if (added.length === 0) return m.reply('⚠️ الكلمات مسجلة مسبقاً في قائمة المنع!');

        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '✅ "تمت إضافة الكلمات"' },
            { type: 'line', text: `📝 الكلمات المضافة (مشفّرة): *${added.map(w => maskWord(w)).join(', ')}*` }
        ]), m);
    }

    // 🟢 2. أمر السماح بكلمة (.سماح)
    if (command === 'سماح') {
        if (!isROwner) return m.reply('> ❌ هذا الأمر مخصص لمطور البوت فقط!');
        if (!text) return m.reply('> 📌 اكتب الكلمة المراد السماح بها: `.سماح الكلمة`');

        const wordToRemove = normalizeText(text);
        const index = badwords.indexOf(wordToRemove);

        if (index === -1) return m.reply('⚠️ هذه الكلمة غير موجودة في قائمة المحظورات!');

        badwords.splice(index, 1);
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '🟢 "تم السماح بالكلمة"' },
            { type: 'line', text: `تمت الإزالة بنجاح: *${maskWord(wordToRemove)}*` }
        ]), m);
    }

    // 📋 3. عرض قائمة الكلمات المحظورة (.المحظورات)
    if (command === 'المحظورات') {
        if (!isROwner) return m.reply('> ❌ هذا الأمر مخصص لمطور البوت فقط!');
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '📜 "قائمة الكلمات المحظورة"' },
            { type: 'line', text: badwords.map(w => `• ${maskWord(w)}`).join('\n') }
        ]), m);
    }
};

// 🛡️ معالج فحص وتصيد السب في جميع الرسائل
handler.all = async function (m) {
    if (!m.isGroup || m.fromMe) return;

    // استخراج النص بجميع الصور الممكنة
    const rawText = m.text || m.caption || (m.msg && m.msg.text) || '';
    if (!rawText) return;

    // التأكد من وجود قائمة الكلمات المحظورة
    if (!global.db.data) global.db.data = {};
    if (!global.db.data.badwords) global.db.data.badwords = [...defaultBadWords];
    const badwords = global.db.data.badwords;

    // فك التشفير والتنظيف
    const normalizedMessage = normalizeText(rawText);

    // البحث عن الكلمة المطابقة
    let detectedWord = null;
    for (const word of badwords) {
        const cleanWord = normalizeText(word);
        if (rawText.toLowerCase().includes(word.toLowerCase()) || normalizedMessage.includes(cleanWord)) {
            detectedWord = word;
            break;
        }
    }

    if (!detectedWord) return;

    // حماية المطورين من الحذف
    const owners = (global.owner || []).map(v => v[0] + '@s.whatsapp.net');
    if (owners.includes(m.sender)) return;

    // جلب بيانات المجموعة وحساب المشرفين
    try {
        const groupMetadata = await this.groupMetadata(m.chat);
        const participants = groupMetadata.participants || [];

        // استثناء مشرفي القروب إذا أرسلوا كلمة محظورة
        const adminSet = new Set(
            participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id)
        );
        if (adminSet.has(m.sender)) return;

        // 1️⃣ حذف الرسالة فوراً
        await this.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender
            }
        }).catch(() => {});

        // 2️⃣ استخراج المشرفين وتحويلهم باستخدام دالة convertLidToRealJid
        const adminMentionsArray = [];
        for (const jid of adminSet) {
            try {
                const cleanJid = await this.convertLidToRealJid(jid, m.chat);
                adminMentionsArray.push(cleanJid || jid);
            } catch {
                adminMentionsArray.push(jid);
            }
        }

        const senderTag = m.sender.split('@')[0];
        const adminMentionsText = adminMentionsArray.map(a => `@${a.split('@')[0]}`).join(' ');

        // تشفير الكلمة المكتشفة قبل إظهارها
        const maskedContent = maskWord(detectedWord);

        // 3️⃣ إرسال التحذير وتنبيه المشرفين مع إظهار الكلمة المشفّرة
        const warnText = theme.build([
            { type: 'title', text: '⚠️ "تحذير: كلمة محظورة"' },
            { type: 'subtitle', text: 'تم حذف رسالة تحتوي على ألفاظ غير لائقة!' },
            { type: 'divider' },
            { type: 'line', text: `👤 *المخالف:* @${senderTag}` },
            { type: 'line', text: `🤬 *الكلمة المكتشفة:* \`${maskedContent}\`` },
            { type: 'spacer' },
            { type: 'line', text: '📢 *إشعار المشرفين للاتخاذ الإجراءات:*' },
            { type: 'line', text: adminMentionsText },
            { type: 'divider' },
            { type: 'line', text: '⚠️ يمنع السب في هذا الجروب وسيتم طردك بواسطة المشرفين.' }
        ]);

        await this.sendMessage(m.chat, {
            text: warnText,
            mentions: [m.sender, ...adminMentionsArray]
        });

    } catch (e) {
        console.error('خطأ في معالج مانع السب:', e);
    }
};

handler.help = ['منع', 'سماح', 'المحظورات'];
handler.tags = ['owner'];
handler.command = /^(منع|سماح|المحظورات)$/i;

export default handler;