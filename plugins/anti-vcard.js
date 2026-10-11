// plugins/anti-vcard.js
// Hammam Bot— كاشف جهات الاتصال والحماية 🛡️🔒

import { theme } from '../core/theme.js';

let handler = async (m) => {};

// 🛡️ معالج فحص وتصيد كروت الاتصال في جميع الرسائل
handler.all = async function (m) {
    if (!m.isGroup || m.fromMe) return;

    // 🔍 التحقق من نوع الرسالة (إذا كانت جهة اتصال أو قائمة جهات اتصال)
    const isVCard = m.mtype === 'contactMessage' || 
                    m.mtype === 'contactsArrayMessage' || 
                    (m.msg && (m.msg.vcard || m.msg.contacts));

    if (!isVCard) return;

    // حماية المطورين من الحذف والعقاب
    const owners = (global.owner || []).map(v => v[0] + '@s.whatsapp.net');
    if (owners.includes(m.sender)) return;

    try {
        const groupMetadata = await this.groupMetadata(m.chat);
        const participants = groupMetadata.participants || [];

        // استثناء مشرفي القروب
        const adminSet = new Set(
            participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id)
        );
        if (adminSet.has(m.sender)) return;

        // 1️⃣ حذف الرسالة (جهة الاتصال) فوراً
        await this.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender
            }
        }).catch(() => {});

        // 2️⃣ قفل المجموعة (تغيير الإعدادات لـ المشرفين فقط)
        await this.groupSettingUpdate(m.chat, 'announcement').catch(e => console.error('فشل قفل القروب:', e));

        // 3️⃣ استخراج المشرفين وتحويلهم باستعمال دالة convertLidToRealJid
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

        // 4️⃣ إرسال التحذير وتنبيه المشرفين
        const warnText = theme.build([
            { type: 'title', text: '🚨 "تنبيه: مشاركة جهة اتصال"' },
            { type: 'subtitle', text: 'تم اكتشاف وحظر مشاركة الأرقام داخل المجموعة!' },
            { type: 'divider' },
            { type: 'line', text: `👤 *المخالف:* @${senderTag}` },
            { type: 'line', text: '🔒 *الإجراء المتخذ:* تم حذف الرقم وقفل القروب تلقائياً!' },
            { type: 'spacer' },
            { type: 'line', text: '📢 *إشعار المشرفين لاتخاذ الإجراء المناسب:*' },
            { type: 'line', text: adminMentionsText },
            { type: 'divider' },
            { type: 'line', text: '⚠️ يُمنع نشر جهات الاتصال والأرقام للحد من الإزعاج!' }
        ]);

        await this.sendMessage(m.chat, {
            text: warnText,
            mentions: [m.sender, ...adminMentionsArray]
        });

    } catch (e) {
        console.error('خطأ في كاشف جهات الاتصال:', e);
    }
};

export default handler;