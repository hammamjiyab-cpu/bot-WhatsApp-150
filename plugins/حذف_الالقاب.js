// plugins/delete_all_lakab.js
// Hammam Bot- حذف جميع ألقاب المجموعة 👥

import { theme } from '../core/theme.js';

let handler = async function (m, { conn }) {
    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        const groupId = m.chat;
        
        let groupInfo;
        try {
            groupInfo = await conn.groupMetadata(groupId);
        } catch (e) {
            return m.reply(theme.build([
                { type: 'title', text: '❌ خـطـأ' },
                { type: 'error', text: 'فشل في الوصول لبيانات المجموعة. تأكد من أن البوت أدمن.' }
            ]));
        }

        const groupMembers = groupInfo.participants;
        
        if (!global.db?.data?.users) {
            return m.reply(theme.build([
                { type: 'title', text: '❌ خـطـأ' },
                { type: 'error', text: 'قاعدة البيانات غير جاهزة' }
            ]));
        }
        
        const users = global.db.data.users;
        const usersWithNicknames = [];
        
        for (let [jid, user] of Object.entries(users)) {
            if (user.groups?.[groupId]?.name) {
                usersWithNicknames.push({ jid, name: user.groups[groupId].name, user });
            }
        }

        if (usersWithNicknames.length === 0) {
            await conn.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } });
            return m.reply(theme.build([
                { type: 'title', text: '⚠️ تـنـبـيـه' },
                { type: 'line', text: 'لا توجد ألقاب مسجلة في هذه المجموعة حالياً.' }
            ]));
        }

        let deletedNames = [];
        for (let item of usersWithNicknames) {
            deletedNames.push(item.name);
            delete item.user.groups[groupId].name;
            if (global.db.writeData) {
                await global.db.writeData('users', item.jid, item.user).catch(() => {});
            }
        }

        let resultMessage = `${theme.divider}\n│\n│ 👥 *تـطـهـيـر الألـقـاب*\n│\n│ 🧹 *تم حذف جميع الألقاب في المجموعة*\n│\n│ 📊 *الإحصائيات النهائية:*\n│ • عدد الألقاب المحذوفة: ${usersWithNicknames.length}\n│ • عدد أعضاء المجموعة: ${groupMembers.length}\n│\n│ 🏷️ *الألقاب المحذوفة:*\n${deletedNames.map((name, i) => `│ ${i + 1}. ${name}`).join('\n')}\n│\n${theme.endDivider}`;

        await conn.sendMessage(m.chat, { text: resultMessage }, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error('حذف_الألقاب error:', err);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(theme.build([
            { type: 'title', text: '❌ خـطـأ' },
            { type: 'error', text: err.message || 'خطأ غير معروف' }
        ]));
    }
};

handler.help = ['حذف_الألقاب'];
handler.tags = ['unions'];
handler.command = /^(حذف_الألقاب|حذف_الالقاب|delete_all)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;