// plugins/game-eye.js
// Hammam Bot- لعبة تخمين الشخصية من العين 👁️

import { theme } from '../core/theme.js';
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import fetch from "node-fetch";

const timeout = 60000;
const reward = 500;

let handler = async (m, { conn, command }) => {

  conn.obito = conn.obito || {};
  const id = m.chat;

  // 🎯 الرد على الأزرار
  if (command.startsWith("مجوب_")) {

    let obito = conn.obito[id];
    if (!obito) {
      await m.react("⏳");
      return conn.reply(m.chat, theme.build([
        { type: 'title', text: '⚠️ "تنبيه"' },
        { type: 'subtitle', text: 'لا توجد مهمة نشطة حالياً' }
      ]), m);
    }

    let selectedIndex = parseInt(command.split("_")[1]);

    if (isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > 4) {
      await m.react("❌");
      return conn.reply(m.chat, theme.build([
        { type: 'title', text: '❄️ "اختيار غير صالح"' }
      ]), m);
    }

    let selectedAnswer = obito.options[selectedIndex - 1];
    let isCorrect = obito.correctAnswer === selectedAnswer;

    if (isCorrect) {

      await m.react("✅");

      if (!global.db.data.users[m.sender].points) {
        global.db.data.users[m.sender].points = 0;
      }
      global.db.data.users[m.sender].points += reward;

      await conn.reply(m.chat, theme.build([
        { type: 'title', text: '✅ "إجابة صحيحة"' },
        { type: 'line', text: `🎉 أحسنت أيها المحارب! +${reward} نقطة` },
        { type: 'divider' },
        { type: 'info', label: 'الإجابة', value: obito.correctAnswer },
        { type: 'info', label: 'نقاطك', value: `${global.db.data.users[m.sender].points} نقطة` }
      ]), m);

      clearTimeout(obito.timer);
      delete conn.obito[id];

    } else {

      obito.attempts -= 1;

      if (obito.attempts > 0) {

        await m.react("❌");

        await conn.reply(m.chat, theme.build([
          { type: 'title', text: '❌ "إجابة خاطئة"' },
          { type: 'info', label: 'المحاولات المتبقية', value: obito.attempts },
          { type: 'divider' },
          { type: 'line', text: '⚔️ حاول مرة أخرى' }
        ]), m);

      } else {

        await m.react("❌");

        await conn.reply(m.chat, theme.build([
          { type: 'title', text: '❌ "انتهت المحاولات"' },
          { type: 'info', label: 'الإجابة الصحيحة', value: obito.correctAnswer }
        ]), m);

        clearTimeout(obito.timer);
        delete conn.obito[id];
      }
    }

    return;
  }

  // 🎯 بدء المهمة
  try {

    if (conn.obito[id]) {
      await m.react("⏳");
      return conn.reply(m.chat, theme.build([
        { type: 'title', text: '⚠️ "تنبيه"' },
        { type: 'subtitle', text: 'لديك مهمة نشطة بالفعل' }
      ]), m);
    }

    const response = await fetch(
      "https://raw.githubusercontent.com/DK3MK/worker-bot/main/eye.json"
    );

    const data = await response.json();

    if (!data.length) throw new Error("No Data");

    const item = data[Math.floor(Math.random() * data.length)];
    const { img, name } = item;

    let options = [name];

    while (options.length < 4) {
      let random = data[Math.floor(Math.random() * data.length)].name;
      if (!options.includes(random)) options.push(random);
    }

    options.sort(() => Math.random() - 0.5);

    const media = await prepareWAMessageMedia(
      { image: { url: img } },
      { upload: conn.waUploadToServer }
    );

    // بناء الأزرار
    const buttons = options.map((option, index) => ({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: `${theme.blood} ${option}`,
        id: `.مجوب_${index + 1}`
      })
    }));

    const interactiveMessage = {
      body: { text: theme.build([
        { type: 'title', text: '👁️ "مهمة تخمين الشخصية"' },
        { type: 'spacer' },
        { type: 'line', text: '🔮 *من صاحب هذه العين؟*' },
        { type: 'divider' },
        { type: 'info', label: '⏰ الوقت', value: '60 ثانية' },
        { type: 'info', label: '⭐ الجائزة', value: `${reward} نقطة` },
        { type: 'info', label: '🎯 المحاولات', value: '2' }
      ]) },
      footer: { text: 'Hammam Bot❄️' },
      header: {
        hasMediaAttachment: true,
        subtitle: '👁️ اختر الشخصية الصحيحة',
        imageMessage: media.imageMessage,
      },
      nativeFlowMessage: {
        buttons: buttons,
        messageParamsJson: JSON.stringify({
          bottom_sheet: {
            list_title: "👁️ اختر اسم الشخصية",
            button_title: "▻ الخيارات ⚡"
          }
        })
      }
    };

    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage)
          }
        }
      },
      { userJid: conn.user.jid, quoted: m }
    );

    await m.react("👁️");

    await conn.relayMessage(m.chat, msg.message, {
      messageId: msg.key.id
    });

    conn.obito[id] = {
      correctAnswer: name,
      options: options,
      attempts: 2,
      timer: setTimeout(async () => {
        if (conn.obito[id]) {
          await conn.reply(m.chat, theme.build([
            { type: 'title', text: '⏰ "انتهى وقت المهمة"' },
            { type: 'info', label: 'الإجابة الصحيحة', value: name }
          ]), m);
          delete conn.obito[id];
        }
      }, timeout)
    };

  } catch (e) {
    console.error('[Eye]', e);
    await m.react("❌");
    conn.reply(m.chat, theme.build([
      { type: 'title', text: '❄️ "فشلت المهمة"' },
      { type: 'warning', text: 'حدث خطأ أثناء بدء اللعبة' }
    ]), m);
  }
};

handler.help = ["عين"];
handler.tags = ["game"];
handler.command = /^(عين|مجوب_\d+)$/i;

export default handler;