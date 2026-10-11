// plugins/game-kt.js
// Hammam Bot- لعبة الألغاز 📝

import { theme } from '../core/theme.js';
import fs from 'fs';
import { join } from 'path';
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

// جلب أسئلة اللعبة
const ktPath = join(process.cwd(), 'src', 'game', 'كت.json');
let ktQuestions = [];

try {
    const data = fs.readFileSync(ktPath, 'utf8');
    ktQuestions = JSON.parse(data);
} catch (err) {
    console.error('[KT] خطأ في تحميل الأسئلة:', err);
    ktQuestions = [];
}

function getRandomQuestion() {
    return ktQuestions[Math.floor(Math.random() * ktQuestions.length)];
}

function getWrongAnswers(correctAnswer, count = 3) {
    const wrong = [];
    const used = new Set();
    used.add(correctAnswer.toLowerCase());
    
    for (let q of ktQuestions) {
        const ans = q.response;
        if (!used.has(ans.toLowerCase()) && ans !== correctAnswer && wrong.length < count) {
            wrong.push(ans);
            used.add(ans.toLowerCase());
        }
    }
    
    const fallback = ['أسد', 'نمر', 'فيل', 'زرافة', 'تمساح', 'ثعبان', 'نسر', 'حوت', 'دلفين', 'قرد'];
    while (wrong.length < count) {
        const fb = fallback[Math.floor(Math.random() * fallback.length)];
        if (!used.has(fb.toLowerCase()) && fb !== correctAnswer) {
            wrong.push(fb);
            used.add(fb.toLowerCase());
        }
    }
    
    return wrong;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

let handler = async (m, { conn }) => {
    
    if (!ktQuestions.length) {
        return conn.reply(m.chat, theme.build([{ type: 'title', text: `قاعدة بيانات فارغة` }, { type: 'divider' }, { type: 'line', text: `🔮 لا توجد أسئلة في قاعدة بيانات اللعبة` }]), m);
    }
    
    const q = getRandomQuestion();
    const correctAnswer = q.response;
    const wrongAnswers = getWrongAnswers(correctAnswer, 3);
    const allAnswers = [correctAnswer, ...wrongAnswers];
    const shuffled = shuffle([...allAnswers]);
    
    const timestamp = Date.now();
    const userId = m.sender.split('@')[0];
    
    const correctCmd = `كت_صحيح_${userId}_${timestamp}`;
    
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[m.sender]) {
        global.db.data.users[m.sender] = {};
    }
    
    global.db.data.users[m.sender].currentKt = {
        question: q.question,
        correctAnswer: correctAnswer,
        correctCmd: correctCmd,
        askedAt: timestamp
    };
    
    const buttons = [];
    for (const answer of shuffled) {
        const isCorrect = answer === correctAnswer;
        const buttonCmd = isCorrect ? correctCmd : `كت_خطأ_${userId}_${timestamp}_${answer.substring(0, 5)}`;
        
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: answer.length > 35 ? answer.substring(0, 32) + '...' : answer,
                id: `.${buttonCmd}`
            })
        });
    }
    
    const menuText = theme.build([
        { type: 'title', text: '📝 "مهمة الألغاز"' },
        { type: 'spacer' },
        { type: 'line', text: `🔮 *${q.question}*` },
        { type: 'divider' },
        { type: 'info', label: '⏰ الوقت', value: '30 ثانية' },
        { type: 'info', label: '⭐ الجائزة', value: '100 نقطة' },
        { type: 'spacer' },
        { type: 'line', text: '⚔️ اختر الإجابة الصحيحة من الأزرار أدناه' }
    ]);
    
    const interactiveMessage = {
        body: { text: menuText },
        footer: { text: 'Hammam Bot❄️' },
        nativeFlowMessage: {
            buttons: buttons,
            messageParamsJson: JSON.stringify({
                bottom_sheet: {
                    list_title: "📝 اختر الإجابة الصحيحة",
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
    
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    
    setTimeout(async () => {
        const userData = global.db.data.users[m.sender];
        if (userData?.currentKt && userData.currentKt.askedAt === timestamp) {
            delete global.db.data.users[m.sender].currentKt;
            await conn.reply(m.chat, theme.build([{ type: 'title', text: `⏰ انتهى وقت المهمة` }, { type: 'divider' }, { type: 'line', text: `🔮 استخدم .كت لمهمة جديدة` }]), m);
        }
    }, 30000);
};

handler.before = async (m, { conn }) => {
    if (!m.isCommand) return false;
    if (!m.text) return false;
    
    const cmd = m.text.toLowerCase();
    
    if (cmd.startsWith('.كت_صحيح_') || cmd.startsWith('.كت_خطأ_')) {
        
        const userKt = global.db.data.users[m.sender]?.currentKt;
        if (!userKt) {
            await conn.reply(m.chat, theme.build([{ type: 'title', text: `لا توجد مهمة نشطة` }, { type: 'divider' }, { type: 'line', text: `🔮 استخدم .كت لبدء مهمة جديدة` }]), m);
            return true;
        }
        
        const isCorrect = cmd === `.${userKt.correctCmd}`;
        
        if (isCorrect) {
            if (!global.db.data.users[m.sender].points) {
                global.db.data.users[m.sender].points = 0;
            }
            global.db.data.users[m.sender].points += 100;
            
            await conn.reply(m.chat, theme.build([{ type: 'title', text: `✅ إجابة صحيحة` }, { type: 'divider' }, { type: 'line', text: `🎉 أحسنت أيها المحارب! +100 نقطة` }, { type: 'line', text: `🔮 الإجابة:` }]) + userKt.correctAnswer + '\n> ⭐ نقاطك: ' + global.db.data.users[m.sender].points + ' نقطة', m);
        } else {
            await conn.reply(m.chat, theme.build([{ type: 'title', text: `❌ إجابة خاطئة` }, { type: 'divider' }, { type: 'error', text: `🔮 الإجابة الصحيحة:` }]) + userKt.correctAnswer, m);
        }
        
        delete global.db.data.users[m.sender].currentKt;
        return true;
    }
    
    return false;
};

handler.command = ['كت', 'kt'];
handler.tags = ['game'];
handler.help = ['كت'];

export default handler;