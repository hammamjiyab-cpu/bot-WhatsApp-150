import { theme } from '../core/theme.js'
// plugins/lakabi.js
// Hammam Bot- عرض لقبي 👥

let handler = async (m, { conn }) => {
    try {
        const groupId = m.chat;
        
        // التأكد من وجود قاعدة البيانات
        if (!global.db?.data?.users) {
            return m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 قاعدة البيانات غير جاهزة` }]));
        }
        
        const users = global.db.data.users;
        const user = users[m.sender];

        if (!user || !user.groups || !user.groups[groupId] || !user.groups[groupId].name) {
            return m.reply(theme.build([{ type: 'title', text: `غير مسجل` }, { type: 'divider' }, { type: 'line', text: `🔮 أنت غير مسجل في هذه المجموعة` }, { type: 'line', text: `📌 استخدم .حجز_لقب لتسجيل لقبك` }]));
        }

        const nickname = user.groups[groupId].name;
        
        let msg = theme.build([{ type: 'title', text: `لقبك` }, { type: 'divider' }, { type: 'line', text: `🏷️ *اللقب:* ${nickname}` }, { type: 'line', text: `👤 *الاسم:* ${m.pushName || m.sender.split('@')[0]}` }]);

        await conn.sendMessage(m.chat, { text: msg }, { quoted: m });

    } catch (err) {
        console.error('[Lakabi]', err);
        await m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message || err}` }]));
    }
};

handler.help = ['لقبي'];
handler.tags = ['unions'];
handler.command = /^(لقبي|mynickname|nick)$/i;
handler.group = true;

export default handler;