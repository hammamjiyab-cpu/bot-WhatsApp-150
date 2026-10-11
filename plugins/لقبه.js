import { theme } from '../core/theme.js'
// plugins/lakabe.js
// Hammam Bot- عرض لقب عضو 👥

let handler = async (m, { conn, text }) => {
    try {
        let mentionedJid;

        // تحديد العضو المستهدف
        if (m.quoted && m.quoted.sender) {
            mentionedJid = await conn.convertLidToRealJid(m.quoted.sender, m.chat);
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            mentionedJid = await conn.convertLidToRealJid(m.mentionedJid[0], m.chat);
        } else if (text) {
            const number = text.replace(/[^0-9]/g, '');
            if (number) {
                mentionedJid = number + '@s.whatsapp.net';
            }
        }

        if (!mentionedJid) {
            return m.reply(theme.build([{ type: 'title', text: `وحدة عرض اللقب` }, { type: 'divider' }, { type: 'line', text: `👥 *الاستخدام:* .لقبه @العضو` }, { type: 'line', text: `📌 أو رد على رسالة العضو` }]));
        }

        // التأكد من وجود قاعدة البيانات
        if (!global.db?.data?.users) {
            return m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 قاعدة البيانات غير جاهزة` }]));
        }

        const users = global.db.data.users;
        const groupId = m.chat;
        const user = users[mentionedJid];

        if (!user || !user.groups || !user.groups[groupId]?.name) {
            let memberName = mentionedJid.split('@')[0];
            try {
                const nameFromConn = await conn.getName(mentionedJid);
                if (nameFromConn) memberName = nameFromConn;
            } catch(e) {}
            
            return m.reply(theme.build([{ type: 'title', text: `لا يوجد لقب` }, { type: 'divider' }, { type: 'line', text: `👤 ${memberName} لا يملك لقباً مسجلاً في هذه المجموعة` }]));
        }

        const nickname = user.groups[groupId].name;
        
        let memberName = mentionedJid.split('@')[0];
        try {
            const nameFromConn = await conn.getName(mentionedJid);
            if (nameFromConn) memberName = nameFromConn;
        } catch(e) {}

        let msg = theme.build([{ type: 'title', text: `لقب العضو` }, { type: 'divider' }, { type: 'line', text: `👤 *العضو:* ${memberName}` }, { type: 'line', text: `🏷️ *اللقب:* ${nickname}` }]);

        await conn.sendMessage(m.chat, { text: msg, mentions: [mentionedJid] }, { quoted: m });

    } catch (err) {
        console.error('[Lakabe]', err);
        await m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message || err}` }]));
    }
};

handler.help = ['لقبه'];
handler.tags = ['unions'];
handler.command = /^(لقبه|nickname|lakabe)$/i;
handler.group = true;

export default handler;