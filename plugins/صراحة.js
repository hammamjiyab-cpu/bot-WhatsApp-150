// plugins/game-tod.js
// Hammam Bot— لعبة صراحة أو جرأة (تحدي النسخ + المواجهة المتبادلة) ⚔️🔥

import { theme } from '../core/theme.js';

// 📚 قائمة أسئلة الصراحة
const truthQuestions = [
    "هل مرة كذبت على أهلك وقلت لهم بروح أذاكر ورحت تلعب؟",
    "ما هو أكبر سر تخفيه عن أصدقائك في هذه المجموعة؟",
    "هل سبق لك وأن قرأت رسائل شخص آخر بدون علمه؟",
    "ما هي أكثر شائعة أطلقتها أو صدقتها عن شخص هنا؟",
    "لو طلب منك التخلي عن تطبيق واحد في هاتفك للأبد، ماذا ستختار؟",
    "هل سبق لك أن تظاهرت بالنوم لتهرب من الحديث مع أحد؟",
    "ما هو الشيء الذي ندمت على شرائه مؤخراً؟",
    "من هو الشخص في المجموعة الذي تتمنى لو تتعرف عليه أكثر؟",
    "ما هي الموقف الأكثر إحراجاً الذي حدث لك هذا العام؟",
    "هل سبق لك وأن نسيت مناسبة مهمة لشخص عزيز عليك؟"
];

// 📚 ألقاب أنمي قصيرة لتحدي النسخ (لتحديد الأسرع)
const animeTitles = [
    "يامي سوكيهيرو", "ماتوكا", "غوكو", "لوفي", "ليفاي", "إيتاشي", "غوجو", "سوكونا", "زورو", "إيرين",
    "كيلوا", "مادارا", "سايتاما", "تانجيرو", "ناروتو", "لولوش", "ميكاسا", "كانيكي", "هيسوكا", "إيتشيجو"
];

// دالة تحويل الـ LID إلى Real JID
async function getRealJid(conn, jid, chatId) {
    if (!jid) return jid;
    try {
        if (typeof conn.convertLidToRealJid === 'function') {
            const clean = await conn.convertLidToRealJid(jid, chatId);
            return clean || jid;
        }
    } catch {}
    return jid;
}

let handler = async (m, { conn, usedPrefix }) => {
    conn.tod = conn.tod || {};
    let id = m.chat;

    if (conn.tod[id]) {
        await m.react("⏳");
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '⚠️ "تنبيه"' },
            { type: 'subtitle', text: 'هناك تحدي قائم بالفعل في هذا الشات!' }
        ]), m);
    }

    let rawTarget = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null);

    if (!rawTarget) {
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '🔥 "تحدي الصراحة أو الجرأة"' },
            { type: 'info', label: '📌 الاستخدام', value: `${usedPrefix}صراحة @منشن_الخصم` },
            { type: 'line', text: 'قم بمنشن الشخص الذي تريد تحديه!' }
        ]), m);
    }

    const player1 = await getRealJid(conn, m.sender, id);
    const player2 = await getRealJid(conn, rawTarget, id);

    if (player1 === player2) {
        return conn.reply(m.chat, '❌ لا يمكنك تحدي نفسك يا بطل!', m);
    }

    const p1Id = player1.split('@')[0];
    const p2Id = player2.split('@')[0];

    // بدء مرحلة تأكيد القبول (WAITING_CONFIRMATION)
    conn.tod[id] = {
        player1,
        player2,
        confirmations: {},
        round: 1, // الجولة الأولى
        step: 'WAITING_CONFIRMATION'
    };

    const confirmText = theme.build([
        { type: 'title', text: '⚔️ "طلب تحدي مواجهة"' },
        { type: 'subtitle', text: `@${p1Id} يتحدى @${p2Id} في لعبة صراحة أو جرأة!` },
        { type: 'divider' },
        { type: 'line', text: '📢 هل أنتم جاهزون لخوض المعركة؟' },
        { type: 'spacer' },
        { type: 'line', text: '💬 أرسل كلمة "*نعم*" للتأكيد، أو "*لا*" لإلغاء التحدي!' }
    ]);

    await conn.sendMessage(m.chat, { text: confirmText, mentions: [player1, player2] }, { quoted: m });
};

handler.before = async (m, { conn }) => {
    let id = m.chat;
    if (!conn.tod || !conn.tod[id]) return false;
    if (!m.text) return false;

    let game = conn.tod[id];
    let senderRealJid = await getRealJid(conn, m.sender, id);
    let text = m.text.trim();
    let textLower = text.toLowerCase();

    // التأكد أن الذي يرسل الرسالة أحد اللاعبين
    if (senderRealJid !== game.player1 && senderRealJid !== game.player2) return false;

    const p1Tag = game.player1.split('@')[0];
    const p2Tag = game.player2.split('@')[0];

    // 🔴 1. مرحلة تأكيد الجاهزية (نعم / لا)
    if (game.step === 'WAITING_CONFIRMATION') {
        if (textLower === 'لا') {
            const cancelText = theme.build([
                { type: 'title', text: '🚫 "تم إلغاء التحدي"' },
                { type: 'subtitle', text: `رفض أحد المتسابقين التحدي!` },
                { type: 'divider' },
                { type: 'line', text: '🔮 يمكنك اختيار متسابق آخر لمواجهته.' }
            ]);
            delete conn.tod[id];
            await conn.sendMessage(m.chat, { text: cancelText, mentions: [game.player1, game.player2] }, { quoted: m });
            return true;
        }

        if (textLower === 'نعم') {
            game.confirmations[senderRealJid] = true;

            // إذا أرسل أحدهما نعم ننتظر الآخر
            if (!game.confirmations[game.player1] || !game.confirmations[game.player2]) {
                await conn.sendMessage(m.chat, { 
                    text: `✅ @${senderRealJid.split('@')[0]} جاهز! وفي انتظار موافقة الطرف الآخر...`, 
                    mentions: [senderRealJid] 
                }, { quoted: m });
                return true;
            }

            // إذا وافق الاثنان، يبدأ تحدي النسخ لمعرفة من الأسرع
            game.step = 'FAST_COPY_RACE';
            game.targetTitle = animeTitles[Math.floor(Math.random() * animeTitles.length)];

            const copyText = theme.build([
                { type: 'title', text: '⚡ "تحدي النسخ السريع"' },
                { type: 'subtitle', text: 'كلا المتسابقين جاهزان! الأسرع بالنسخ يختار التحدي!' },
                { type: 'divider' },
                { type: 'line', text: '📜 *انسخ النص التالي بسرعة وأرسله:*' },
                { type: 'spacer' },
                { type: 'line', text: `\`${game.targetTitle}\`` },
                { type: 'spacer' },
                { type: 'divider' },
                { type: 'line', text: '🔥 من يرسله أولاً سيكسب الأفضلية!' }
            ]);

            await conn.sendMessage(m.chat, { text: copyText, mentions: [game.player1, game.player2] }, { quoted: m });
            return true;
        }
    }

    // ⚡ 2. مرحلة مسابقة النسخ (تحديد الفائز والمنفذ)
    if (game.step === 'FAST_COPY_RACE') {
        let cleanText = text.replace(/`/g, '');
        if (cleanText === game.targetTitle) {
            game.winner = senderRealJid; // الفائز بالنسخ
            game.loser = senderRealJid === game.player1 ? game.player2 : game.player1; // الخاسر
            game.step = 'CHOOSE_TYPE';

            const winnerTag = game.winner.split('@')[0];
            const loserTag = game.loser.split('@')[0];

            const chooseTypePrompt = theme.build([
                { type: 'title', text: '👑 "أسرع ناسخ"' },
                { type: 'subtitle', text: `@${winnerTag} كان الأسرع في النسخ!` },
                { type: 'divider' },
                { type: 'line', text: `🎯 *يا @${loserTag} أنت الخاسر، اختر مصيرك الآن:*` },
                { type: 'spacer' },
                { type: 'line', text: '1️⃣ - صــراحــة' },
                { type: 'line', text: '2️⃣ - جــرأة' },
                { type: 'spacer' },
                { type: 'line', text: '💬 *أرسل رقم اختيارك (1 أو 2)*' }
            ]);

            await conn.sendMessage(m.chat, { text: chooseTypePrompt, mentions: [game.player1, game.player2] }, { quoted: m });
            return true;
        }
    }

    // 🎯 3. اختيار 1 (صراحة) أو 2 (جرأة) من قبل الخاسر
    if (game.step === 'CHOOSE_TYPE') {
        if (senderRealJid !== game.loser) return false;

        const loserTag = game.loser.split('@')[0];
        const winnerTag = game.winner.split('@')[0];

        if (text === '1') {
            game.step = 'WAITING_TRUTH_ANSWER';
            game.currentQuestion = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];

            const truthText = theme.build([
                { type: 'title', text: '💬 "سؤال صراحة"' },
                { type: 'divider' },
                { type: 'line', text: `❓ *السؤال المطلوب للـ @${loserTag}:*` },
                { type: 'spacer' },
                { type: 'line', text: `\`${game.currentQuestion}\`` },
                { type: 'spacer' },
                { type: 'divider' },
                { type: 'line', text: `💬 *أرسل إجابتك مباشرة في الرسالة القادمة!*` }
            ]);

            await conn.sendMessage(m.chat, { text: truthText, mentions: [game.player1, game.player2] }, { quoted: m });
            return true;

        } else if (text === '2') {
            game.step = 'WAITING_DARE_CHALLENGE';

            const darePrompt = theme.build([
                { type: 'title', text: '⚔️ "تحدي الجرأة"' },
                { type: 'divider' },
                { type: 'line', text: `🎯 *يا @${winnerTag} اكتب التحدي المطلوب تنفيذه من @${loserTag}:*` },
                { type: 'spacer' },
                { type: 'line', text: '💬 (مثال: غير افتارك إلى صورة يحددها الخصم)' }
            ]);

            await conn.sendMessage(m.chat, { text: darePrompt, mentions: [game.player1, game.player2] }, { quoted: m });
            return true;
        }
    }

    // 💬 4أ. إجابة الصراحة والتحول للجولة الثانية تلقائياً
    if (game.step === 'WAITING_TRUTH_ANSWER') {
        if (senderRealJid !== game.loser) return false;

        const loserTag = game.loser.split('@')[0];
        const winnerTag = game.winner.split('@')[0];

        // في حال كانت الجولة الأولى: نعكس الأدوار ونبدأ الجولة الثانية تلقائياً!
        if (game.round === 1) {
            game.round = 2;
            game.loser = winnerTag === p1Tag ? game.player2 : game.player1;
            game.winner = senderRealJid;
            game.step = 'CHOOSE_TYPE';

            const nextLoserTag = game.loser.split('@')[0];

            const resultRound1 = theme.build([
                { type: 'title', text: '💬 "تمت الإجابة - الجولة الأولى"' },
                { type: 'divider' },
                { type: 'line', text: `❓ *السؤال:* ${game.currentQuestion}` },
                { type: 'line', text: `🗣️ *إجابة @${loserTag}:*` },
                { type: 'spacer' },
                { type: 'line', text: `\`${text}\`` },
                { type: 'spacer' },
                { type: 'divider' },
                { type: 'line', text: `📢 *صارحك بهذا الشيء يا @${winnerTag}! وحان دورك الآن!* 🔥` },
                { type: 'line', text: `🎯 *يا @${nextLoserTag} اختر نوع التحدي للجولة الثانية:*` },
                { type: 'spacer' },
                { type: 'line', text: '1️⃣ - صــراحــة' },
                { type: 'line', text: '2️⃣ - جــرأة' }
            ]);

            await conn.sendMessage(m.chat, { text: resultRound1, mentions: [game.player1, game.player2] }, { quoted: m });
            return true;

        } else { // انتهاء الجولة الثانية وبذلك تنتهي المباراة
            const finalResult = theme.build([
                { type: 'title', text: '🎉 "اكتملت المواجهة المتبادلة"' },
                { type: 'divider' },
                { type: 'line', text: `❓ *السؤال:* ${game.currentQuestion}` },
                { type: 'line', text: `🗣️ *إجابة @${loserTag}:*` },
                { type: 'spacer' },
                { type: 'line', text: `\`${text}\`` },
                { type: 'spacer' },
                { type: 'divider' },
                { type: 'line', text: '🏆 *تمت اللعبتان بنجاح واكتمل التحدي للطرفين!*' }
            ]);

            delete conn.tod[id];
            await conn.sendMessage(m.chat, { text: finalResult, mentions: [game.player1, game.player2] }, { quoted: m });
            return true;
        }
    }

    // ⚔️ 4ب. تحديد التحدي من الفائز
    if (game.step === 'WAITING_DARE_CHALLENGE') {
        if (senderRealJid !== game.winner) return false;

        game.step = 'WAITING_DARE_EXECUTION';
        const loserTag = game.loser.split('@')[0];

        const executeDare = theme.build([
            { type: 'title', text: '⚔️ "تطبيق التحدي"' },
            { type: 'divider' },
            { type: 'line', text: `🔥 *التحدي المطلوب من @${loserTag}:*` },
            { type: 'spacer' },
            { type: 'line', text: `\`${text}\`` },
            { type: 'spacer' },
            { type: 'divider' },
            { type: 'line', text: `📢 *قم بتنفيذ التحدي ثم أرسل كلمة "تم"!*` }
        ]);

        await conn.sendMessage(m.chat, { text: executeDare, mentions: [game.player1, game.player2] }, { quoted: m });
        return true;
    }

    // ✅ 5. تأكيد التنفيذ "تم" والتحول للجولة الثانية أو الإنهاء
    if (game.step === 'WAITING_DARE_EXECUTION') {
        if (senderRealJid !== game.loser) return false;

        if (textLower === 'تم') {
            const loserTag = game.loser.split('@')[0];
            const winnerTag = game.winner.split('@')[0];

            if (game.round === 1) {
                game.round = 2;
                game.loser = winnerTag === p1Tag ? game.player2 : game.player1;
                game.winner = senderRealJid;
                game.step = 'CHOOSE_TYPE';

                const nextLoserTag = game.loser.split('@')[0];

                const dareRound1 = theme.build([
                    { type: 'title', text: '✅ "تم التنفيذ - الجولة الأولى"' },
                    { type: 'subtitle', text: `نفذ @${loserTag} التحدي بنجاح أمام @${winnerTag}! 🔥` },
                    { type: 'divider' },
                    { type: 'line', text: `📢 *الحين جاء دورك يا @${nextLoserTag}!*` },
                    { type: 'line', text: 'اختر نوع التحدي للجولة الثانية:' },
                    { type: 'spacer' },
                    { type: 'line', text: '1️⃣ - صــراحــة' },
                    { type: 'line', text: '2️⃣ - جــرأة' }
                ]);

                await conn.sendMessage(m.chat, { text: dareRound1, mentions: [game.player1, game.player2] }, { quoted: m });
                return true;

            } else {
                const finishAll = theme.build([
                    { type: 'title', text: '🎉 "اكتملت اللعبتان بنجاح"' },
                    { type: 'subtitle', text: `أثبت كلا المحاربين شجاعتهما في التحدي! ⚔️🔥` },
                    { type: 'divider' },
                    { type: 'line', text: '🔮 انتهت الجولتان بالكامل، يمكنك بدء تحدي جديد الآن!' }
                ]);

                delete conn.tod[id];
                await conn.sendMessage(m.chat, { text: finishAll, mentions: [game.player1, game.player2] }, { quoted: m });
                return true;
            }
        }
    }

    return false;
};

handler.help = ["صراحة", "جرأة"];
handler.tags = ["game"];
handler.command = /^(صراحة|صراحه|جرأة|جراة|tod)$/i;

export default handler;