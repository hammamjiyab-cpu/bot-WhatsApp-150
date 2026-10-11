// plugins/zawgny.js
// Hammam Bot- أمر زواج عشوائي 💍

import fetch from 'node-fetch';
import { theme } from '../core/theme.js';

let toM = a => '@' + a.split('@')[0];

let handler = async (m, { conn, groupMetadata }) => {
    try {
        // ✅ إصلاح: نجيب المشاركين حتى لو groupMetadata null
        let ps = [];
        let cleanJid = (jid) => {
            if (!jid) return '';
            // لو LID، نستخرج الرقم من phoneNumber
            return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        };
        
        if (groupMetadata?.participants) {
            ps = groupMetadata.participants.map(v => {
                // نستخدم phoneNumber لو موجود، وإلا id
                if (v.phoneNumber && v.phoneNumber.includes('@s.whatsapp.net')) {
                    return v.phoneNumber;
                }
                if (v.id && v.id.includes('@s.whatsapp.net')) {
                    return v.id;
                }
                // نحول LID لرقم حقيقي
                const num = (v.phoneNumber || v.id || '').replace(/[^0-9]/g, '');
                return num ? num + '@s.whatsapp.net' : '';
            }).filter(Boolean);
        } else if (conn.chats?.[m.chat]?.metadata?.participants) {
            ps = conn.chats[m.chat].metadata.participants.map(v => {
                if (v.phoneNumber && v.phoneNumber.includes('@s.whatsapp.net')) {
                    return v.phoneNumber;
                }
                if (v.id && v.id.includes('@s.whatsapp.net')) {
                    return v.id;
                }
                const num = (v.phoneNumber || v.id || '').replace(/[^0-9]/g, '');
                return num ? num + '@s.whatsapp.net' : '';
            }).filter(Boolean);
        } else {
            try {
                const meta = await conn.groupMetadata(m.chat);
                ps = meta.participants.map(v => {
                    if (v.phoneNumber && v.phoneNumber.includes('@s.whatsapp.net')) {
                        return v.phoneNumber;
                    }
                    if (v.id && v.id.includes('@s.whatsapp.net')) {
                        return v.id;
                    }
                    const num = (v.phoneNumber || v.id || '').replace(/[^0-9]/g, '');
                    return num ? num + '@s.whatsapp.net' : '';
                }).filter(Boolean);
            } catch(e) {
                return m.reply(theme.build([
                    { type: 'title', text: '❄️ "هذه المهمة تتطلب مجموعة"' }
                ]));
            }
        }
        
        if (ps.length < 2) {
            return m.reply(theme.build([
                { type: 'title', text: '❄️ "عدد غير كافٍ"' },
                { type: 'warning', text: 'المجموعة تحتاج إلى عضوين على الأقل لتنفيذ المهمة' }
            ]));
        }
        
        // اختيار عريس عشوائي
        let a = ps[Math.floor(Math.random() * ps.length)];
        
        // اختيار عروس عشوائي مختلف عن العريس
        let b;
        do {
            b = ps[Math.floor(Math.random() * ps.length)];
        } while (b === a);

        // ✅ التأكد من صحة JIDs قبل الاستخدام
        if (!a.includes('@s.whatsapp.net') || !b.includes('@s.whatsapp.net')) {
            return m.reply(theme.build([
                { type: 'title', text: '❄️ "خطأ في بيانات الأعضاء"' }
            ]));
        }

        // رابط الصورة (لحفل الزواج)
        const imageUrl = 'https://telegra.ph/file/0dde86d97f9cab0ea3ccb.jpg';
        
        // تحميل الصورة
        const imageRes = await fetch(imageUrl);
        const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

        // إرسال الصورة مع رسالة الزواج
        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: theme.build([
                { type: 'title', text: '💍 "إعلان ارتباط"' },
                { type: 'spacer' },
                { type: 'info', label: '👨‍💼 العريس', value: toM(a) },
                { type: 'info', label: '👩‍💼 العروس', value: toM(b) },
                { type: 'divider' },
                { type: 'line', text: '🎉 ألف مبروك للمحاربين!' },
                { type: 'line', text: '⚔️ كل واحد يجهز عتاده للاحتفال' }
            ]),
            mentions: [a, b]
        }, { quoted: m });
        
        await conn.sendMessage(m.chat, { react: { text: '💍', key: m.key } });

    } catch (err) {
        console.error('[زوجني] error:', err);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(theme.build([
            { type: 'title', text: '❄️ "فشلت مهمة الارتباط"' },
            { type: 'warning', text: err.message || 'خطأ غير معروف' }
        ]));
    }
};

handler.help = ['زوجني'];
handler.tags = ['entertainment'];
handler.command = /^(زوجني|زواج|تزوج)$/i;
handler.group = true;

export default handler;