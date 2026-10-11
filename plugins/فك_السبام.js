// plugins/anti-spam-lock.js
// Hammam Bot— كاشف السبام وحماية المجموعة 🛡️🔒

import { theme } from '../core/theme.js';

// ذاكرة مؤقتة لتتبع عدد الرسائل في الرام (تتصفح وتُصفر تلقائياً)
global.spamTracker = global.spamTracker || {};

let handler = async (m, { conn, command }) => {
    // أمر .فك_السبام للمشرفين لإلغاء القفل وتصفية السجل
    if (/^(فك_السبام|فك_سبام|clearspam)$/i.test(command)) {
        if (!m.isGroup) return;
        
        // التحقق من صلاحيات المشرف
        const groupMetadata = await conn.groupMetadata(m.chat);
        const adminSet = new Set(
            (groupMetadata.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id)
        );

        if (!adminSet.has(m.sender)) {
            return m.reply(theme.build([{ type: 'title', text: `صلاحيات غير كافية` }, { type: 'divider' }, { type: 'line', text: `⚠️ فقط المشرفين يمكنهم استخدام هذا الأمر.` }]));
        }

        if (global.spamTracker[m.chat]) {
            if (global.spamTracker[m.chat].timer) {
                clearTimeout(global.spamTracker[m.chat].timer);
            }
            delete global.spamTracker[m.chat];
        }

        await conn.groupSettingUpdate(m.chat, 'not_announcement').catch(() => {});
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        return conn.reply(m.chat, theme.build([{ type: 'title', text: `✅ تم تصفية سجلات السبام وفك قفل المجموعة بنجاح` }]), m);
    }
};

// 🛡️ معالج فحص وتصيد السبام في كافة الرسائل (مطابق لهيكلية anti-vcard.js)
handler.all = async function (m) {
    if (!m.isGroup || m.fromMe) return;

    // استثناء المطورين
    const owners = (global.owner || []).map(v => v[0] + '@s.whatsapp.net');
    if (owners.includes(m.sender)) return;

    try {
        const groupMetadata = await this.groupMetadata(m.chat);
        const participants = groupMetadata.participants || [];

        // استثناء مشرفي القروب من الحظر
        const adminSet = new Set(
            participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id)
        );
        if (adminSet.has(m.sender)) return;

        let chatId = m.chat;
        let sender = m.sender;
        let now = Date.now();

        // تهيئة بيانات السجل للقروب
        global.spamTracker[chatId] = global.spamTracker[chatId] || { users: {}, isLocked: false };
        let chatData = global.spamTracker[chatId];

        if (chatData.isLocked) return;

        let userData = chatData.users[sender] || { count: 0, lastReset: now };

        // إعادة تصفير العداد بعد انقضاء دقيقة (60,000 مللي ثانية)
        if (now - userData.lastReset > 60000) {
            userData.count = 1;
            userData.lastReset = now;
        } else {
            userData.count++;
        }

        chatData.users[sender] = userData;

        // 🚨 عند تجاوز 10 رسائل/أوامر في الدقيقة
        if (userData.count > 10) {
            chatData.isLocked = true;

            // 1️⃣ قفل المجموعة تلقائياً (للمشرفين فقط)
            await this.groupSettingUpdate(chatId, 'announcement').catch(e => console.error('فشل قفل القروب:', e));

            // 2️⃣ استخراج المشرفين وتحويلهم باستخدام دالة convertLidToRealJid
            const adminMentionsArray = [];
            for (const jid of adminSet) {
                try {
                    const cleanJid = await this.convertLidToRealJid(jid, chatId);
                    adminMentionsArray.push(cleanJid || jid);
                } catch {
                    adminMentionsArray.push(jid);
                }
            }

            const senderTag = sender.split('@')[0];
            const adminMentionsText = adminMentionsArray.map(a => `@${a.split('@')[0]}`).join(' ');

            // 3️⃣ إرسال التحذير وتنبيه المشرفين
            const warnText = theme.build([
                { type: 'title', text: '🚨 "نظام الطوارئ: سبام مكثف"' },
                { type: 'subtitle', text: 'تم إغلاق المجموعة مؤقتاً بسبب تجاوز حد استخدام الأوامر!' },
                { type: 'divider' },
                { type: 'line', text: `👤 *المتسبب:* @${senderTag}` },
                { type: 'line', text: '🔒 *الإجراء المتخذ:* تم قفل القروب وسيعاد فتحه تلقائياً بعد 5 دقائق.' },
                { type: 'spacer' },
                { type: 'line', text: '📢 *إشعار المشرفين:*' },
                { type: 'line', text: adminMentionsText },
                { type: 'divider' },
                { type: 'line', text: '💡 يمكن للمشرف إرسال `.فك_السبام` لإلغاء القفل وتصفية السجل فوراً.' }
            ]);

            await this.sendMessage(chatId, {
                text: warnText,
                mentions: [sender, ...adminMentionsArray]
            });

            // 4️⃣ مؤقت الفتح التلقائي بعد 5 دقائق (300,000 مللي ثانية)
            chatData.timer = setTimeout(async () => {
                if (global.spamTracker[chatId] && global.spamTracker[chatId].isLocked) {
                    await this.groupSettingUpdate(chatId, 'not_announcement').catch(() => {});
                    delete global.spamTracker[chatId];
                    await this.sendMessage(chatId, {
                        text: theme.build([{ type: 'title', text: `🔓 تم فك قفل المجموعة تلقائياً` }, { type: 'divider' }, { type: 'line', text: `انتهت فترة العقوبة (5 دقائق)، تم استئناف الدردشة.` }])
                    });
                }
            }, 300000);
        }

    } catch (e) {
        console.error('خطأ في معالج كاشف السبام:', e);
    }
};

handler.help = ['فك_السبام'];
handler.tags = ['admin'];
handler.command = /^(فك_السبام|فك_سبام|clearspam)$/i;

export default handler;