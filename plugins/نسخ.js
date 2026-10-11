// plugins/game-fastcopy.js
// Hammam Bot- لعبة أسرع ناسخ (أكثر من 100 لقب أنمي قصير) ⚡⚔️

import { theme } from '../core/theme.js';

let timeout = 45000;
let poin = 300;

// 📚 قائمة واسعة تضم أكثر من 100 اسم ولقب أنمي قصير
const animeTitles = [
    "يامي سوكيهيرو", "ماتوكا", "غوكو", "لوفي", "ليفاي", "إيتاشي", "غوجو", "سوكونا", "زورو", "إيرين",
    "كيلوا", "مادارا", "سايتاما", "تانجيرو", "ناروتو", "لولوش", "ميكاسا", "إينوزوكا", "غارا", "كانيكي",
    "هيسوكا", "إيتشيجو", "ديو", "جينتوكي", "أيزن", "ساسكي", "سانجي", "باكوغو", "ميدوريا", "تودوروكي",
    "أول مايت", "كورابيكا", "يوريو", "غون", "جين", "نيتيرو", "ميرويم", "بيتو", "بوكل", "كرولو",
    "شيزوكو", "فيتان", "نوبوناغا", "فرينش", "شيكامارو", "كاكاشي", "جيرايا", "تسونادي", "أوروتشيمارو", "أوبيتو", "شيسوي", "هاشيراما", "توبيراما", "ميناتو", "كوشينا", "هيناتا", "ساكورا", "نيجي", "روك لي", "غاي",
    "أسكاني", "راينر", "بيرتولدت", "أني", "أرمين", "جين شتاين", "كوني", "ساشا", "أروين", "هانجي",
    "زيك", "فالكو", "غابي", "روكيا", "أوراهارا", "يوروإيتشي", "كوراوساكي", "بياكيا", "رينجي", "كيميمارو",
    "غيلغامش", "إسكندر", "أرتوريا", "شيرو", "توساكا", "كيريتسوغو", "كيريتو", "أسونا", "شينون", "كلاين",
    "سوبارو", "إميليا", "ريم", "رام", "بياتريس", "روسوال", "إكيدنا", "غارفيل", "أوتو", "فيلت",
    "راينهارد", "تاتسومو", "إسديث", "أكامي", "ماين", "لوبوك", "بولات", "شيل", "كورومي", "شيدو"
];

let handler = async (m, { conn }) => {

    conn.fastcopy = conn.fastcopy || {};
    conn.lastTitlePlayed = conn.lastTitlePlayed || {};
    let id = m.chat;

    // التحقق من وجود لعبة قائمة
    if (conn.fastcopy[id]) {
        await m.react("⏳");
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '⚠️ "تنبيه"' },
            { type: 'subtitle', text: 'هناك تحدي قائم بالفعل، انتظر انتهاء الجولة!' }
        ]), m);
    }

    // تجنب تكرار آخر لقب تم اختياره
    let lastTitle = conn.lastTitlePlayed[id];
    let availableTitles = animeTitles.filter(t => t !== lastTitle);
    if (availableTitles.length === 0) availableTitles = animeTitles;

    let targetTitle = availableTitles[Math.floor(Math.random() * availableTitles.length)];
    conn.lastTitlePlayed[id] = targetTitle;

    const timestamp = Date.now();

    let caption = theme.build([
        { type: 'title', text: '⚡ "أسرَع نـاسِـخ - ألقاب أنمي"' },
        { type: 'subtitle', text: 'أول شخص ينسخ النص القصير يفوز!' },
        { type: 'divider' },
        { type: 'line', text: '📜 *اللقب المطلوب:*' },
        { type: 'spacer' },
        { type: 'line', text: `\`${targetTitle}\`` },
        { type: 'spacer' },
        { type: 'divider' },
        { type: 'info', label: '⏰ الوقت', value: `${(timeout / 1000).toFixed(0)} ثانية` },
        { type: 'info', label: '⭐ الجائزة', value: `${poin} نقطة` },
        { type: 'divider' },
        { type: 'line', text: '⚔️ اضغط على اللقب لنسخه فوراً وأرسله!' }
    ]);

    let sent = await conn.reply(m.chat, caption, m);

    // إنشـاء المؤقت المباشر
    let timer = setTimeout(async () => {
        if (conn.fastcopy[id] && conn.fastcopy[id].askedAt === timestamp) {
            delete conn.fastcopy[id];
            await conn.reply(m.chat, theme.build([{ type: 'title', text: `⏰ انتهى وقت المهمة` }, { type: 'divider' }, { type: 'line', text: `🔮 استخدم .نسخ لمهمة جديدة` }]), sent);
        }
    }, timeout);

    // حفظ بيانات الجلسة بشكل كائن (Object) بدلاً من مصفوفة لمنع التداخل
    conn.fastcopy[id] = {
        msg: sent,
        targetTitle: targetTitle,
        poin: poin,
        askedAt: timestamp,
        timer: timer
    };

    await m.react("✍️");
};

// 🔥 معالج الإجابات
handler.before = async (m, { conn }) => {
    let id = m.chat;
    if (!conn.fastcopy || !conn.fastcopy[id]) return false;
    if (!m.text) return false;

    let game = conn.fastcopy[id];
    let userAnswer = m.text.trim().replace(/`/g, '');
    let correctAnswer = game.targetTitle.trim();

    if (userAnswer === correctAnswer) {

        if (!global.db.data.users) global.db.data.users = {};
        if (!global.db.data.users[m.sender]) {
            global.db.data.users[m.sender] = {};
        }
        if (!global.db.data.users[m.sender].points) {
            global.db.data.users[m.sender].points = 0;
        }
        global.db.data.users[m.sender].points += game.poin;

        let winnerTag = m.sender.split('@')[0];

        await conn.reply(m.chat, theme.build([
            { type: 'title', text: '🎉 "أسرع ناسخ أسطوري"' },
            { type: 'divider' },
            { type: 'info', label: '👑 الفائز', value: `@${winnerTag}` },
            { type: 'info', label: '⭐ الجائزة', value: `+${game.poin} نقطة` },
            { type: 'info', label: 'نقاطك الحالية', value: `${global.db.data.users[m.sender].points} نقطة` }
        ]), m, { mentions: [m.sender] });

        // إلغاء المؤقت وحذف الجلسة فور الفوز
        clearTimeout(game.timer);
        delete conn.fastcopy[id];
        return true;
    }

    return false;
};

handler.help = ["نسخ", "ناسخ"];
handler.tags = ["game"];
handler.command = /^(نسخ|ناسخ|اسرع_ناسخ|اسرع|fastcopy)$/i;

export default handler;