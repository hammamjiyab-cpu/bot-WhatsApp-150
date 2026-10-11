// plugins/game-akinator.js
// Hammam Bot— لعبة احزر الشخصية (نظام محلي بدون AI) 🎯⚔️

import fs from 'fs';
import path from 'path';
import { theme } from '../core/theme.js';

const databasePath = path.resolve('./src/data/characters.json');

if (!fs.existsSync(path.dirname(databasePath))) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

const defaultCharacters = [
    { name: "يامي", hint: "قائد فرقة ثيران الأسود المحبوب من أنمي بلاك كلوفر" },
    { name: "لوفي", hint: "قبطان طاقم قبعة القش ويسعى ليكون ملك القراصنة" },
    { name: "غوكو", hint: "محارب سايان أسطوري من أنمي دراغون بول يحب الأكل والقتال" },
    { name: "ليفاي", hint: "أقوى جندي للبشرية وقائد فرقة الاستطلاع من أنمي هجوم العمالقة" },
    { name: "إيتاشي", hint: "عبقري من عشيرة الأوتشيها ضحى بكل شيء لحماية قريته وأخيه" },
    { name: "غوجو", hint: "مدرس أقوى سحرة الجوجوتسو وصاحب العينين اللانهائيتين" },
    { name: "سايتاما", hint: "بطل يقضي على أي خصم بلكمة واحدة فقط من أنمي ون بنش مان" },
    { name: "تانجيرو", hint: "قاتل شياطين يحمل أخته في صندوق ويستخدم تنفس الشمس" },
    { name: "ناروتو", hint: "فتى يحمل ثعلب الكيوبي بداخل وسعى حتى أصبح الهوكاجي السابع" },
    { name: "مادارا", hint: "شبح الأوتشيها الذي أسس قرية الكونوها مع هاشيراما" },
    { name: "كيلوا", hint: "قاتل محترف سابق وصديق غون المفضل ويستخدم طاقة الكهرباء" },
    { name: "زورو", hint: "سياف يستخدم أسلوب الثلاثة سيوف ويضيع طريقه دائماً" },
    { name: "إيرين", hint: "صاحب العزم الصلب وحامل العملاق المهاجم من هجوم العمالقة" },
    { name: "لولوش", hint: "أمير بريطاني حصل على قوة الجياس لقيادة الثورة باسم زيرو" },
    { name: "كانيكي", hint: "طالب جامعي تحول إلى غول بعين واحدة بعد حادثة مشؤومة" }
];

function loadCharacters() {
    if (!fs.existsSync(databasePath)) {
        fs.writeFileSync(databasePath, JSON.stringify(defaultCharacters, null, 2));
        return defaultCharacters;
    }
    try {
        const data = fs.readFileSync(databasePath, 'utf-8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCharacters;
    } catch {
        return defaultCharacters;
    }
}

function saveCharacters(data) {
    fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

let timeout = 60000; // 60 ثانية
let poin = 400;

let handler = async (m, { conn, command, isOwner }) => {

    conn.guessChar = conn.guessChar || {};
    conn.addCharSession = conn.addCharSession || {};
    conn.lastCharPlayed = conn.lastCharPlayed || {};
    let id = m.chat;

    // 👑 1. أمر المطور: توسيع الشخصية
    if (command.startsWith('توسيع')) {
        if (!isOwner) {
            return conn.reply(m.chat, '❌ هذا الأمر مخصص لمطور البوت فقط!', m);
        }

        conn.addCharSession[m.sender] = {
            step: 1,
            name: '',
            hint: ''
        };

        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '📝 "توسيع الشخصيات"' },
            { type: 'subtitle', text: 'اكتب اسم الشخصية التي تريد إضافتها الآن:' }
        ]), m);
    }

    // 🎮 2. أمر بدء اللعبة
    if (conn.guessChar[id]) {
        await m.react("⏳");
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '⚠️ "تنبيه"' },
            { type: 'subtitle', text: 'هناك جولة قائمة بالفعل في هذه المجموعة!' }
        ]), m);
    }

    let characters = loadCharacters();
    if (characters.length === 0) {
        return m.reply('❌ لا توجد شخصيات مسجلة في قاعدة البيانات حالياً!');
    }

    // فلترة الشخصية الأخيرة لعدم تكرارها فوراً
    let lastChar = conn.lastCharPlayed[id];
    let availableChars = characters.filter(c => c.name !== lastChar);
    if (availableChars.length === 0) availableChars = characters;

    let selected = availableChars[Math.floor(Math.random() * availableChars.length)];
    conn.lastCharPlayed[id] = selected.name; // حفظ آخر شخصية تم اختيارها

    const timestamp = Date.now();

    let caption = theme.build([
        { type: 'title', text: '🎯 "احـزر الشخصيـة"' },
        { type: 'subtitle', text: 'من هي الشخصية المقصودة بناءً على التلميح؟' },
        { type: 'divider' },
        { type: 'line', text: '💡 *التلميح:*' },
        { type: 'spacer' },
        { type: 'line', text: `\`${selected.hint}\`` },
        { type: 'spacer' },
        { type: 'divider' },
        { type: 'info', label: '⏰ الوقت', value: `${(timeout / 1000)} ثانية` },
        { type: 'info', label: '⭐ الجائزة', value: `${poin} نقطة` },
        { type: 'divider' },
        { type: 'line', text: '⚔️ أرسل اسم الشخصية مباشرة في الدردشة للفوز!' }
    ]);

    let sent = await conn.reply(m.chat, caption, m);

    // إنشاء المؤقت
    let timer = setTimeout(async () => {
        if (conn.guessChar[id] && conn.guessChar[id].askedAt === timestamp) {
            delete conn.guessChar[id];
            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '⏰ "انتهى الوقت"' },
                { type: 'info', label: 'الشخصية كانت', value: selected.name }
            ]), sent);
        }
    }, timeout);

    conn.guessChar[id] = {
        msg: sent,
        name: selected.name,
        poin: poin,
        askedAt: timestamp,
        timer: timer
    };

    await m.react("❓");
};

// ⚡ 3. المعالج التفاعلي والإجابات
handler.before = async (m, { conn }) => {
    let id = m.chat;
    if (!m.text) return false;

    // 🅰️ إضافة شخصية جديدة
    conn.addCharSession = conn.addCharSession || {};
    if (conn.addCharSession[m.sender]) {
        let session = conn.addCharSession[m.sender];

        if (session.step === 1) {
            session.name = m.text.trim();
            session.step = 2;

            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '📝 "توسيع الشخصيات"' },
                { type: 'info', label: 'الشخصية', value: session.name },
                { type: 'subtitle', text: 'الآن اكتب وصف أو تلميح الشخصية:' }
            ]), m);
            return true;
        }

        if (session.step === 2) {
            session.hint = m.text.trim();

            let list = loadCharacters();
            let existingIndex = list.findIndex(c => c.name.toLowerCase() === session.name.toLowerCase());

            if (existingIndex !== -1) {
                list[existingIndex].hint = session.hint;
            } else {
                list.push({ name: session.name, hint: session.hint });
            }

            saveCharacters(list);

            await conn.reply(m.chat, theme.build([
                { type: 'title', text: '✅ "تمت إضافة الشخصية"' },
                { type: 'info', label: 'اسم الشخصية', value: session.name },
                { type: 'info', label: 'الوصف/التلميح', value: session.hint },
                { type: 'info', label: 'إجمالي الشخصيات', value: `${list.length} شخصية` }
            ]), m);

            delete conn.addCharSession[m.sender];
            return true;
        }
    }

    // 🅱️ معالجة إجابة اللعبة
    if (!conn.guessChar || !conn.guessChar[id]) return false;

    let game = conn.guessChar[id];
    let userAnswer = m.text.trim().toLowerCase().replace(/`/g, '');
    let target = game.name.trim().toLowerCase();

    if (userAnswer === target) {

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
            { type: 'title', text: '🎉 "إجابة صحيحة!"' },
            { type: 'subtitle', text: 'أحسنت! تم التعرف على الشخصية بنجاح' },
            { type: 'divider' },
            { type: 'info', label: '👑 البطل', value: `@${winnerTag}` },
            { type: 'info', label: '👤 الشخصية', value: game.name },
            { type: 'info', label: '⭐ الجائزة', value: `+${game.poin} نقطة` }
        ]), m, { mentions: [m.sender] });

        // إيقاف المؤقت فوراً وتفريغ الجلسة بالكامل لفتح اللعبة فوراً
        clearTimeout(game.timer);
        delete conn.guessChar[id];
        return true;
    }

    return false;
};

handler.help = ["احزر", "توسيع_الشخصيه"];
handler.tags = ["game"];
handler.command = /^(احزر|احزر_شخصية|احزر_شخصيه|توسيع_الشخصيه|توسيع_الشخصية)$/i;

export default handler;