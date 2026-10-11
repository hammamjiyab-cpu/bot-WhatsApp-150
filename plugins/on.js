/*╭━━━〔 CREDITS 〕━━━╮
│ 👑 الـمـطـور ↜ Hammam Bot
│ 🌾 قــنــاة الــمــطـور ↜ global.CHANNEL_LINK
│ الوظيفه: الترحيب والمغادرة التلقائية + تجربة الترحيب (.ترحيب)
╰━━━━━━━━━━━━━━━━━━╯
*/

import fetch from 'node-fetch'

// إعداد كرت القناة للاستخدام في الردود
const channelCard = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: global.ch.ch1,
      newsletterName: global.botName,
      serverMessageId: -1
    }
  }
};

// رابط الصوت المعتمد
const audioUrl = 'https://file.garden/aauvg01sjleV_ic1/%D8%AA%D8%B1%D8%AD%D9%8A%D8%A8.opus';

// روابط الصور
const welcomeImage = 'https://file.garden/aopbTIvyBCZ1OfsC/63d9ab76e1b8b5664f4b0fc2dd13996b.jpg';
const goodbyeImage = 'https://file.garden/aopbTIvyBCZ1OfsC/63d9ab76e1b8b5664f4b0fc2dd13996b.jpg';

// دالة مساعدة لتحويل LID إلى JID حقيقي
const getRealJid = async (conn, jid, groupJid) => {
  if (!jid) return jid;
  try {
    const cleanJid = await conn.convertLidToRealJid(jid, groupJid);
    return cleanJid || jid;
  } catch {
    return jid;
  }
};

// 1️⃣ أمر التحكم (.on welcome / .off welcome) أو تجربة الترحيب (.ترحيب)
const handler = async (m, { conn, command, args, isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) return m.reply('🔒 هذا الأمر مخصص للجروبات فقط.');

  // أمر تجربة الترحيب للمطور فقط (.ترحيب)
  if (/^(ترحيب|تست_ترحيب|welcome_test)$/i.test(command)) {
    if (!isROwner && !isOwner) {
      return conn.sendMessage(m.chat, { 
        text: '❌ هذا الأمر مخصص لمطور البوت فقط لتجربة الترحيب.', 
        ...channelCard 
      }, { quoted: m });
    }

    await m.react('🧪');

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({}));
    const groupName = groupMetadata.subject || 'المجموعة';
    const groupDescription = groupMetadata.desc || 'لا يوجد وصف للمجموعة';
    const groupSize = groupMetadata.participants ? groupMetadata.participants.length : 'غير معروف';

    // تحويل LID المرسل إلى Real JID
    const realSenderJid = await getRealJid(conn, m.sender, m.chat);
    const userMention = `@${realSenderJid.split('@')[0].split(':')[0]}`;

    const txtwelcome = `╭━━ ✨ *أهـلاً بـك فـي عـائـلـتـنـا (تجربة)* ━━⃝💖\n` +
       `│\n` +
       `│ 🌸 *أنرت المكان بحضورك الجمبل!*\n` +
       `│ يسعدنا جداً انضمامك معنا ونتمنى لك أوقاتاً ممتعة 💕\n` +
       `│\n` +
       `│ 👤 *صديقنا الجديد:* ${userMention}\n` +
       `│ 📍 *المجموعة:* ${groupName}\n` +
       `│ 👥 *عائلتنا الآن:* ${groupSize} عضو\n` +
       `│\n` +
       `│ 📝 *نبذة قصيرة عن مجموعتنا:*\n` +
       `│ ${groupDescription.substring(0, 150)}\n` +
       `│\n` +
       `│ 🤖 *أنا بوت المجموعة الخادمة والمتكاملة!*\n` +
       `│ متواجد لمساعدتكم وتوفير جميع الأوامر والخدمات الممتعة والمفيدة ⚡\n` +
       `│\n` +
       `│ 💡 *لاستكشاف جميع الأوامر والخدمات المميزة:*\n` +
       `│ أرسل الكلمة التالية فقط: *.اوامر*\n` +
       `│\n` +
       `╰━━━━━━━━━━━━━⃝💖`;

    try {
      await conn.sendMessage(m.chat, {
        image: { url: welcomeImage },
        caption: txtwelcome,
        mentions: [realSenderJid],
        ...channelCard
      }, { quoted: m });

      const audioBuffer = await (await fetch(audioUrl)).buffer();
      await conn.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        ...channelCard
      }, { quoted: m });

      await m.react('✅');
    } catch (e) {
      await m.react('❌');
      await conn.sendMessage(m.chat, { 
        text: `❌ فشل تجريب الترحيب:\n${e.message}`, 
        ...channelCard 
      }, { quoted: m });
    }
    return;
  }

  // أومر التفعيل والتعطيل (.on welcome / .off welcome)
  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
  const chat = global.db.data.chats[m.chat];
  const type = (args[0] || '').toLowerCase();
  const enable = command === 'on';

  if (type !== 'welcome') {
    return m.reply(`╭━━ 🌟 *أمـر الـتـرحـيـب* ━━⃝💙\n│\n│ 🔹 *.on welcome* / *.off welcome*\n│\n╰━━━━━━━━━━━━━⃝💙`);
  }

  if (!(isAdmin || isOwner)) return m.reply('❌ هذا الأمر للمشرفين فقط.');

  chat.welcome = enable;
  return m.reply(`✅ *الترحيب* ${enable ? 'تم التفعيل' : 'تم التعطيل'} بنجاح.`);
};

// 2️⃣ المعالج التلقائي لدخول وخروج الأعضاء الفعلية
handler.before = async (m, { conn }) => {
  if (!m.isGroup) return;
  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
  const chat = global.db.data.chats[m.chat];

  if (!chat.welcome) return;
  
  // الأحداث الخاصة بالانضمام والمغادرة
  const stubType = m.messageStubType;
  if (![27, 28, 32].includes(stubType)) return;

  let groupMetadata, groupSize, rawUserId, realUserId, userMention, groupDescription;
  
  try {
    groupMetadata = await conn.groupMetadata(m.chat);
    groupSize = groupMetadata.participants.length;
    groupDescription = groupMetadata.desc || "لا يوجد وصف متاح";
  } catch (e) {
    console.error('[Welcome] Error getting group metadata:', e.message);
    return;
  }

  rawUserId = m.messageStubParameters?.[0] || m.sender;
  // تحويل معرف العضو المحدد من LID إلى Real JID
  realUserId = await getRealJid(conn, rawUserId, m.chat);
  userMention = `@${realUserId.split('@')[0].split(':')[0]}`;

  // ========== ترحيب تلقائي عند الدخول ==========
  if (stubType === 27) {
    const txtwelcome = `╭━━ ✨ *أهـلاً بـك فـي عـائـلـتـنـا* ━━⃝💖\n` +
       `│\n` +
       `│ 🌸 *أنرت المكان بحضورك الجمبل!*\n` +
       `│ يسعدنا جداً انضمامك معنا ونتمنى لك أوقاتاً ممتعة 💕\n` +
       `│\n` +
       `│ 👤 *صديقنا الجديد:* ${userMention}\n` +
       `│ 📍 *المجموعة:* ${groupMetadata.subject}\n` +
       `│ 👥 *عائلتنا الآن:* ${groupSize} عضو\n` +
       `│\n` +
       `│ 📝 *نبذة قصيرة عن مجموعتنا:*\n` +
       `│ ${groupDescription.substring(0, 150)}\n` +
       `│\n` +
       `│ 🤖 *أنا بوت المجموعة الخادمة والمتكاملة!*\n` +
       `│ متواجد لمساعدتكم وتوفير جميع الأوامر والخدمات الممتعة والمفيدة ⚡\n` +
       `│\n` +
       `│ 💡 *لاستكشاف جميع الأوامر والخدمات المميزة:*\n` +
       `│ أرسل الكلمة التالية فقط: *.اوامر*\n` +
       `│\n` +
       `╰━━━━━━━━━━━━━⃝💖`;

    try {
      // إرسال الصورة
      await conn.sendMessage(m.chat, {
        image: { url: welcomeImage },
        caption: txtwelcome,
        mentions: [realUserId],
        ...channelCard
      });

      // إرسال بصمة الصوت كـ Buffer
      const audioBuffer = await (await fetch(audioUrl)).buffer();
      await conn.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        ...channelCard
      });
    } catch (e) {
      console.error('[Welcome] Error sending welcome message:', e.message);
    }
  }

  // ========== مغادرة تلقائية ==========
  if (stubType === 28 || stubType === 32) {
    const txtBye = `╭━━ 😢 *وداعـاً* ━━⃝💙\n` +
       `│\n` +
       `│ 👤 *صديقنا المغادر:* ${userMention}\n` +
       `│ 📍 *المجموعة:* ${groupMetadata.subject}\n` +
       `│ 👥 *الأعضاء المتبقين:* ${groupSize}\n` +
       `│\n` +
       `│ 💔 *نتمنى رؤيتك مرة أخرى*\n` +
       `│\n` +
       `╰━━━━━━━━━━━━━⃝💙`;

    try {
      await conn.sendMessage(m.chat, {
        image: { url: goodbyeImage },
        caption: txtBye,
        mentions: [realUserId],
        ...channelCard
      });
    } catch (e) {
      console.error('[Welcome] Error sending goodbye message:', e.message);
    }
  }
};

handler.command = ['on', 'off', 'ترحيب', 'تست_ترحيب', 'welcome_test'];
handler.group = true;

export default handler;