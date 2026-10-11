import { theme } from '../core/theme.js'
// plugins/motawer.js
// Hammam Bot- التحقق من توفر اللقب 👥

let handler = async (m, { conn, text }) => {
    try {
        const groupId = m.chat;
        const name = text?.trim();

        if (!name) {
            return m.reply(theme.build([{ type: 'title', text: `وحدة التحقق من اللقب` }, { type: 'divider' }, { type: 'line', text: `✍️ *يرجى إدخال اللقب*` }, { type: 'line', text: `📌 *مثال:* .متوفر الأسطورة` }]));
        }

        // التأكد من وجود قاعدة البيانات
        if (!global.db?.data?.users) {
            return m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 قاعدة البيانات غير جاهزة` }]));
        }

        const users = global.db.data.users;
        let taken = false;
        let owner = null;

        for (let key in users) {
            const user = users[key];
            if (user.groups?.[groupId]?.name?.toLowerCase() === name.toLowerCase()) {
                taken = true;
                owner = key;
                break;
            }
        }

        if (taken) {
            let ownerName = owner.split('@')[0];
            try {
                const nameFromConn = await conn.getName(owner);
                if (nameFromConn) ownerName = nameFromConn;
            } catch(e) {}
            
            await conn.sendMessage(m.chat, { text: theme.build([{ type: 'title', text: `اللقب غير متاح` }, { type: 'divider' }, { type: 'line', text: `❌ *اللقب* "${name}" محجوز بالفعل` }, { type: 'line', text: `👤 *بواسطة:* ${ownerName}` }]) }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: theme.build([{ type: 'title', text: `اللقب متاح` }, { type: 'divider' }, { type: 'line', text: `✅ *اللقب* "${name}" متاح للحجز` }, { type: 'line', text: `💡 *للحجز:* .حجز_لقب ${name}` }]) }, { quoted: m });
        }

    } catch (err) {
        console.error('[Motawer]', err);
        await m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message || err}` }]));
    }
};

handler.help = ['متوفر <لقب>'];
handler.tags = ['unions'];
handler.command = /^(متوفر|available|check)$/i;
handler.group = true;

export default handler;