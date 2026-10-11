// plugins/game-flag.js
// Hammam Bot- لعبة أعلام الدول 🏁

import { theme } from '../core/theme.js';
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';

const timeout = 60000;
const reward = 500;

let handler = async (m, { conn, command }) => {
    
    conn.obito = conn.obito || {};

    // 🎯 معالج الإجابة على الأزرار
    if (command.startsWith('اجاب_')) {
        let id = m.chat;
        let obito = conn.obito ? conn.obito[id] : null;

        if (!obito) {
            await m.react('⏳');
            return conn.reply(m.chat, theme.build([
                { type: 'title', text: '⚠️ "تنبيه"' },
                { type: 'subtitle', text: 'لا توجد مهمة نشطة الآن' }
            ]), m);
        }

        let selectedAnswerIndex = parseInt(command.split('_')[1]);
        if (isNaN(selectedAnswerIndex) || selectedAnswerIndex < 1 || selectedAnswerIndex > 4) {
            await m.react('❌');
            return conn.reply(m.chat, theme.build([
                { type: 'title', text: '❄️ "اختيار غير صالح"' }
            ]), m);
        }

        let selectedAnswer = obito.options[selectedAnswerIndex - 1];
        let isCorrect = obito.correctAnswer === selectedAnswer;

        if (isCorrect) {
            await m.react('✅');

            if (!global.db.data.users[m.sender].points) {
                global.db.data.users[m.sender].points = 0;
            }
            global.db.data.users[m.sender].points += reward;

            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '✅ "إجابة صحيحة"' },
                { type: 'line', text: `🎉 أحسنت أيها المحارب! +${reward} نقطة` },
                { type: 'divider' },
                { type: 'info', label: 'الدولة', value: obito.correctAnswer },
                { type: 'info', label: 'نقاطك', value: `${global.db.data.users[m.sender].points} نقطة` }
            ]), m);

            clearTimeout(obito.timer);
            delete conn.obito[id];
        } else {
            obito.attempts -= 1;

            if (obito.attempts > 0) {
                await m.react('❌');
                await conn.reply(m.chat, theme.build([
                    { type: 'title', text: '❌ "إجابة خاطئة"' },
                    { type: 'info', label: 'المحاولات المتبقية', value: obito.attempts },
                    { type: 'divider' },
                    { type: 'line', text: '⚔️ حاول مرة أخرى' }
                ]), m);
            } else {
                await m.react('❌');
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

    // 🎯 بدء مهمة جديدة
    try {
        let id = m.chat;

        if (conn.obito[id]) {
            await m.react('⏳');
            return conn.reply(m.chat, theme.build([
                { type: 'title', text: '⚠️ "تنبيه"' },
                { type: 'subtitle', text: 'لديك مهمة نشطة بالفعل' }
            ]), m);
        }

        // جلب بيانات الأعلام
        const response = await fetch('https://raw.githubusercontent.com/ze819/game/master/src/game.js/luffy1.json');
        const obitoData = await response.json();
        
        if (!obitoData.length) throw new Error('No data');

        const obitoItem = obitoData[Math.floor(Math.random() * obitoData.length)];
        const { img, name } = obitoItem;

        // توليد خيارات عشوائية
        let options = [name];
        while (options.length < 4) {
            let randomItem = obitoData[Math.floor(Math.random() * obitoData.length)].name;
            if (!options.includes(randomItem)) options.push(randomItem);
        }
        options.sort(() => Math.random() - 0.5);

        const media = await prepareWAMessageMedia({ image: { url: img } }, { upload: conn.waUploadToServer });

        // بناء الأزرار
        const buttons = options.map((option, index) => ({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: `${theme.blood} ${option}`,
                id: `.اجاب_${index + 1}`
            })
        }));

        const interactiveMessage = {
            body: { text: theme.build([
                { type: 'title', text: '🏁 "مهمة أعلام الدول"' },
                { type: 'spacer' },
                { type: 'line', text: '🔮 *ما هي الدولة صاحبة هذا العلم؟*' },
                { type: 'divider' },
                { type: 'info', label: '⏰ الوقت', value: '60 ثانية' },
                { type: 'info', label: '⭐ الجائزة', value: `${reward} نقطة` },
                { type: 'info', label: '🎯 المحاولات', value: '2' }
            ]) },
            footer: { text: 'Hammam Bot❄️' },
            header: {
                hasMediaAttachment: true,
                subtitle: '🏁 اختر الدولة الصحيحة',
                imageMessage: media.imageMessage,
            },
            nativeFlowMessage: {
                buttons: buttons,
                messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                        list_title: "🏁 اختر اسم الدولة",
                        button_title: "▻ الخيارات ⚡"
                    }
                })
            }
        };

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage)
                }
            }
        }, { userJid: conn.user.jid, quoted: m });

        await m.react('🏁');
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

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
        console.error('[Flag]', e);
        await m.react('❌');
        conn.reply(m.chat, theme.build([
            { type: 'title', text: '❄️ "فشلت المهمة"' },
            { type: 'warning', text: 'حدث خطأ أثناء بدء اللعبة' }
        ]), m);
    }
};

handler.help = ['علم'];
handler.tags = ['game'];
handler.command = /^(علم|اعلام|اجاب_\d+)$/i;

export default handler;