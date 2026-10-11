// plugins/warn.js
// ⧼ 𝑷𝑹𝑶𝑻𝑶𝑻𝒀𝑷𝑬 ⧽v2 - نظام التحذير

let handler = async (m, { conn, text, command, usedPrefix }) => {
    
    // 🛡️ منع تحذير البوت نفسه
    if (m.mentionedJid && m.mentionedJid.includes(conn.user.jid)) {
        return m.reply(`╭━━ 🛡️ *تـنـبـيـه* ━━⃝💙
│
│ 🤖 لا يمكنك تحذير البوت نفسه!
│
╰━━━━━━━━━━━━━⃝💙`);
    }
    
    // منع تحذير المطورين
    const developers = (global.owner || []).map(n => n + '@s.whatsapp.net');
    if (m.mentionedJid && developers.includes(m.mentionedJid[0])) {
        return m.reply(`╭━━ 👑 *تـنـبـيـه* ━━⃝💙
│
│ 👑 لا يمكنك تحذير مطور البوت!
│
╰━━━━━━━━━━━━━⃝💙`);
    }

    let who = null;
    
    // الحصول على المستخدم
    if (m.mentionedJid && m.mentionedJid[0]) {
        who = m.mentionedJid[0];
    } else if (m.quoted && m.quoted.sender) {
        who = m.quoted.sender;
    } else {
        await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } });
        return m.reply(`⚠️ *طريقة الاستخدام:*\n\nرد على رسالة الشخص أو اكتب:\n${usedPrefix + command} @user`);
    }

    if (!who) return;

    who = who.split('@')[0] + '@s.whatsapp.net';

    // قاعدة البيانات
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[who]) global.db.data.users[who] = { warn: 0 };

    let user = global.db.data.users[who];
    let targetName = who.split('@')[0];
    
    try {
        let name = await conn.getName(who);
        if (name) targetName = name;
    } catch(e) {}

    // ========== تحذير ==========
    if (command === 'تحذير' || command === 'انذار' || command === 'warn') {
        const reason = text ? text.replace(/@\d+-?\d*/g, '').trim() : 'بدون سبب';
        user.warn = (user.warn || 0) + 1;

        await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } });
        
        let msg = `╭━━ ⚠️ *إِنذار جَديد* ━━⃝💙
│
│ 👤 *العضو:* ${targetName}
│ 📝 *السبب:* ${reason}
│ 📊 *العدد:* ${user.warn}/3
│
╰━━━━━━━━━━━━━⃝💙`;
        
        await conn.sendMessage(m.chat, { text: msg, mentions: [who] }, { quoted: m });

        if (user.warn >= 3) {
            user.warn = 0;
            let kickMsg = `╭━━ 🚫 *طرد* ━━⃝💙
│
│ 👤 *العضو:* ${targetName}
│ ⚠️ *تم طرده لبلوغ 3 إنذارات*
│
╰━━━━━━━━━━━━━⃝💙`;
            await conn.sendMessage(m.chat, { text: kickMsg, mentions: [who] }, { quoted: m });
            await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
        }
    }

    // ========== إلغاء تحذير ==========
    if (command === 'الغاء_انذار' || command === 'الغاء') {
        if (!user.warn || user.warn === 0) {
            return m.reply(`⚠️ هذا العضو ليس لديه إنذارات`);
        }

        user.warn -= 1;
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
        let msg = `╭━━ ✅ *تم إلغاء الإنذار* ━━⃝💙
│
│ 👤 *العضو:* ${targetName}
│ 📊 *المتبقي:* ${user.warn}/3
│
╰━━━━━━━━━━━━━⃝💙`;
        
        await conn.sendMessage(m.chat, { text: msg, mentions: [who] }, { quoted: m });
    }
};

handler.command = ['تحذير', 'انذار', 'warn', 'الغاء_انذار', 'الغاء'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
