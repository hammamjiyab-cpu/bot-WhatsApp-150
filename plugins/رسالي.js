// plugins/stats.js
// Hammam Bot- إحصائيات المجموعة 📊

import { theme } from '../core/theme.js'

// بيانات المجموعات
if (!global.groupData) global.groupData = {};

let handler = async (m, { conn, participants, groupMetadata, command }) => {
    const chatId = m.chat;

    if (!global.groupData[chatId]) global.groupData[chatId] = {};
    const groupUsers = global.groupData[chatId];

    if (!groupUsers[m.sender]) groupUsers[m.sender] = { messagesSent: 0 };

    // ✅ إصلاح: نجيب اسم المجموعة من 3 مصادر مختلفة
    let groupName = 'المجموعة';
    try {
        // 1. من groupMetadata (المصدر الأساسي)
        if (groupMetadata?.subject) {
            groupName = groupMetadata.subject;
        }
        // 2. من conn.chats
        else if (conn.chats?.[chatId]?.subject) {
            groupName = conn.chats[chatId].subject;
        }
        else if (conn.chats?.[chatId]?.name) {
            groupName = conn.chats[chatId].name;
        }
        // 3. من conn.getName
        else {
            const name = await conn.getName(chatId);
            if (name && name !== chatId.split('@')[0]) {
                groupName = name;
            }
        }
    } catch(e) {
        groupName = chatId.split('@')[0];
    }
    
    // رابط الفيديو الاحتياطي (في حالة عدم وجود صورة)
    const videoUrl = 'https://file.garden/aauvg01sjleV_ic1/VID-20260529-WA0150.mp4';

    // محاولة جلب صورة المستخدم
    let hasProfilePic = false;
    let profilePicUrl = null;
    
    try {
        profilePicUrl = await conn.profilePictureUrl(m.sender, 'image');
        hasProfilePic = true;
    } catch (e) {
        hasProfilePic = false;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. عرض إحصائيات الفرد (رسائلي)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (command === 'رسائلي' || command === 'رسايلي') {
        const messagesSent = groupUsers[m.sender].messagesSent || 0;
        
        const caption = theme.build([
            { type: 'title', text: '📊 "تقرير نشاطك"' },
            { type: 'divider' },
            { type: 'info', label: '👤 المحارب', value: m.pushName || m.sender.split('@')[0] },
            { type: 'info', label: '👥 المجموعة', value: groupName },
            { type: 'info', label: '📨 الرسائل', value: messagesSent }
        ]);

        if (hasProfilePic && profilePicUrl) {
            await conn.sendMessage(m.chat, {
                image: { url: profilePicUrl },
                caption: caption
            }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: caption,
                gifPlayback: false,
                mimetype: 'video/mp4'
            }, { quoted: m });
        }
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. عرض إجمالي المجموعة (اجمالي)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else if (command === 'اجمالي' || command === 'total') {
        const parts = participants || [];
        const activeMembers = new Set(parts.map(p => p.id));
        
        const sortedUsers = Object.entries(groupUsers)
            .filter(([jid]) => activeMembers.has(jid))
            .sort((a, b) => (b[1].messagesSent || 0) - (a[1].messagesSent || 0));

        const totalMessages = sortedUsers.reduce((sum, u) => sum + (u[1].messagesSent || 0), 0);
        const totalMembers = parts.length;

        let resultMessage = theme.build([
            { type: 'title', text: '📊 "تقرير المجموعة"' },
            { type: 'divider' },
            { type: 'info', label: '👥 المجموعة', value: groupName },
            { type: 'info', label: '🔮 الأعضاء', value: totalMembers },
            { type: 'info', label: '📨 إجمالي الرسائل', value: totalMessages }
        ]);

        if (sortedUsers.length > 0) {
            const king = sortedUsers[0];
            let kingName = king[0].split('@')[0];
            try {
                const nameFromConn = await conn.getName(king[0]);
                if (nameFromConn) kingName = nameFromConn;
            } catch(e) {}
            
            resultMessage += `\n` + theme.build([
                { type: 'divider' },
                { type: 'title', text: '👑 ملك التفاعل' },
                { type: 'info', label: '⚔️ الاسم', value: kingName },
                { type: 'info', label: '📨 الرسائل', value: king[1].messagesSent }
            ]);
        }

        resultMessage += `\n` + theme.build([
            { type: 'divider' },
            { type: 'title', text: '🏆 ترتيب المحاربين (Top 10)' }
        ]);

        for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
            const [user, data] = sortedUsers[i];
            let userName = user.split('@')[0];
            try {
                const nameFromConn = await conn.getName(user);
                if (nameFromConn) userName = nameFromConn;
            } catch(e) {}
            resultMessage += `\n│ ${i + 1}. ${userName} ⇽ (${data.messagesSent})`;
        }

        resultMessage += `\n` + theme.endDivider;

        // جلب صورة المجموعة (إذا وجدت)
        let groupPic = null;
        try {
            groupPic = await conn.profilePictureUrl(m.chat, 'image');
        } catch(e) {}

        const mentionsList = sortedUsers.slice(0, 10).map(([user]) => user).filter(Boolean);

        if (groupPic) {
            await conn.sendMessage(m.chat, {
                image: { url: groupPic },
                caption: resultMessage,
                mentions: mentionsList
            }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: resultMessage,
                gifPlayback: false,
                mimetype: 'video/mp4',
                mentions: mentionsList
            }, { quoted: m });
        }
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
};

// تحديث العداد تلقائياً لكل رسالة
handler.all = async (m) => {
    if (!m.text || !m.isGroup) return;
    
    if (!global.groupData) global.groupData = {};
    const chatId = m.chat;
    if (!global.groupData[chatId]) global.groupData[chatId] = {};

    const groupUsers = global.groupData[chatId];
    if (!groupUsers[m.sender]) groupUsers[m.sender] = { messagesSent: 0 };
    groupUsers[m.sender].messagesSent += 1;
};

handler.help = ['رسائلي', 'اجمالي'];
handler.tags = ['unions'];
handler.command = /^(رسائلي|رسايلي|اجمالي|total)$/i;
handler.group = true;

export default handler;