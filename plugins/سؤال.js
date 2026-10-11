// plugins/quiz.js
// Hammam Bot- أسئلة تفاعلية 🎯

import { theme } from '../core/theme.js';
import fs from 'fs';
import { join } from 'path';
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

// جلب الأسئلة
const questionsPath = join(process.cwd(), 'src', 'game', 'questions.json');
let questions = [];

try {
    const data = fs.readFileSync(questionsPath, 'utf8');
    questions = JSON.parse(data);
} catch (err) {
    console.error('[Quiz] خطأ في تحميل الأسئلة:', err);
    questions = [];
}

function getRandomQuestion() {
    return questions[Math.floor(Math.random() * questions.length)];
}

function getWrongAnswers(correctAnswer, count = 3) {
    const wrong = [];
    const used = new Set();
    used.add(correctAnswer.toLowerCase());
    
    for (let q of questions) {
        const ans = q.response;
        if (!used.has(ans.toLowerCase()) && ans !== correctAnswer && wrong.length < count) {
            wrong.push(ans);
            used.add(ans.toLowerCase());
        }
    }
    
    const fallback = ['ناروتو', 'ساسكي', 'لوفي', 'ايتشيغو', 'تانجيرو', 'غوكو', 'مادارا', 'كاكاشي'];
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
    
    if (!questions.length) {
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '❄️ "قاعدة بيانات فارغة"' },
            { type: 'warning', text: 'لا توجد أسئلة في قاعدة البيانات' }
        ]), m);
    }
    
    const q = getRandomQuestion();
    const correctAnswer = q.response;
    const wrongAnswers = getWrongAnswers(correctAnswer, 3);
    const allAnswers = [correctAnswer, ...wrongAnswers];
    const shuffled = shuffle([...allAnswers]);
    
    const timestamp = Date.now();
    const userId = m.sender.split('@')[0];
    
    // 🔥 الـ ID بتاع الزر الصحيح (هيكون أمر)
    const correctCmd = `جواب_صحيح_${userId}_${timestamp}`;
    
    // حفظ السؤال
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[m.sender]) {
        global.db.data.users[m.sender] = {};
    }
    
    global.db.data.users[m.sender].currentQuiz = {
        question: q.question,
        correctAnswer: correctAnswer,
        correctCmd: correctCmd,
        askedAt: timestamp
    };
    
    // بناء الأزرار (كل زر يرسل أمر مختلف)
    const buttons = [];
    for (const answer of shuffled) {
        const isCorrect = answer === correctAnswer;
        const buttonCmd = isCorrect ? correctCmd : `جواب_خطأ_${userId}_${timestamp}_${answer.substring(0, 5)}`;
        
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: answer.length > 35 ? answer.substring(0, 32) + '...' : answer,
                id: `.${buttonCmd}`  // 🔥 النقطة عشان يتحول لأمر
            })
        });
    }
    
    const menuText = theme.build([
        { type: 'title', text: '🎯 "سؤال اختباري"' },
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
                    list_title: "🎯 اختر إجابتك",
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
    
    // حذف السؤال بعد 30 ثانية
    setTimeout(async () => {
        const userData = global.db.data.users[m.sender];
        if (userData?.currentQuiz && userData.currentQuiz.askedAt === timestamp) {
            delete global.db.data.users[m.sender].currentQuiz;
            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '⏰ "انتهى وقت المهمة"' },
                { type: 'line', text: 'استخدم .سؤال_خيارات لمهمة جديدة' }
            ]), m);
        }
    }, 30000);
};

// 🔥 الأزرار هتتحول لأوامر، وهنا بنمسكها
handler.before = async (m, { conn }) => {
    // التأكد إن الرسالة أمر
    if (!m.isCommand) return false;
    if (!m.text) return false;
    
    const cmd = m.text.toLowerCase();
    
    // التحقق إذا كان الأمر يخص اختبار
    if (cmd.startsWith('.جواب_صحيح_') || cmd.startsWith('.جواب_خطأ_')) {
        
        const userQuiz = global.db.data.users[m.sender]?.currentQuiz;
        if (!userQuiz) {
            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '❄️ "لا توجد مهمة نشطة"' },
                { type: 'line', text: 'استخدم .سؤال_خيارات لبدء مهمة جديدة' }
            ]), m);
            return true;
        }
        
        const isCorrect = cmd === `.${userQuiz.correctCmd}`;
        
        if (isCorrect) {
            if (!global.db.data.users[m.sender].points) {
                global.db.data.users[m.sender].points = 0;
            }
            global.db.data.users[m.sender].points += 100;
            
            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '✅ "إجابة صحيحة"' },
                { type: 'line', text: '🎉 أحسنت أيها المحارب! +100 نقطة' },
                { type: 'divider' },
                { type: 'info', label: 'الإجابة الصحيحة', value: userQuiz.correctAnswer },
                { type: 'info', label: 'نقاطك', value: `${global.db.data.users[m.sender].points} نقطة` }
            ]), m);
        } else {
            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '❌ "إجابة خاطئة"' },
                { type: 'line', text: 'للأسف إجابتك غير صحيحة' },
                { type: 'divider' },
                { type: 'info', label: 'الإجابة الصحيحة', value: userQuiz.correctAnswer }
            ]), m);
        }
        
        // حذف السؤال
        delete global.db.data.users[m.sender].currentQuiz;
        return true;
    }
    
    return false;
};

handler.command = ['سؤال_خيارات', 'سؤال', 'quiz'];
handler.tags = ['game'];
handler.help = ['سؤال_خيارات'];

export default handler;