// plugins/nicknames.js
// Hammam Bot- نظام الألقاب 🏷️

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR   = './data';
const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
const NICK_FILE  = path.join(DATA_DIR, 'nicknames.json');

// ضمان وجود المجلدات
if (!fs.existsSync(DATA_DIR))   fs.mkdirSync(DATA_DIR,   { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// تحميل قاعدة البيانات
function loadNicknames() {
    try {
        if (fs.existsSync(NICK_FILE)) return JSON.parse(fs.readFileSync(NICK_FILE, 'utf-8'));
    } catch {}
    return {};
}

function saveNicknames(data) {
    fs.writeFileSync(NICK_FILE, JSON.stringify(data, null, 2));
}

function normalizeNick(nick) {
    return nick.trim().toLowerCase()
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
}

function hashNick(nick) {
    return crypto.createHash('md5').update(nick).digest('hex').slice(0, 10);
}

// حالة التسجيل لكل مستخدم: { step, nickname }
if (!global.nickRegState) global.nickRegState = new Map();
if (!global.nicknamesDB) global.nicknamesDB = loadNicknames();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// أمر .تسجيل الرئيسي
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let handler = async (m, { conn, command }) => {

    // .لقبي — عرض لقب العضو الحالي
    if (command === 'لقبي') {
        const db = global.nicknamesDB;
        const found = Object.entries(db).find(([, v]) => v.jid === m.sender);
        if (!found) return m.reply('> ℹ️ ** ما لديك لقب مسجل بعد\n> 📌 استخدم .تسجيل');
        return m.reply(`> 🏷️ *لقبك المسجل:* ${found[0]}`);
    }

    // .الالقاب — عرض كل الألقاب
    if (command === 'الالقاب') {
        const db = global.nicknamesDB;
        const list = Object.keys(db);
        if (!list.length) return m.reply('> ℹ️ ** لا توجد ألقاب مسجلة بعد');
        return m.reply(`> 🏷️ *الألقاب المسجلة:*\n> \n${list.map((n, i) => `> ${i+1}. ${n}`).join('\n')}`);
    }

    // .حذف_لقب — المطور فقط
    if (command === 'حذف_لقبي') {
        const db = global.nicknamesDB;
        const found = Object.keys(db).find(k => db[k].jid === m.sender);
        if (!found) return m.reply('> ℹ️ ** ما لديك لقب مسجل');
        const videoPath = db[found].videoPath;
        if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        delete db[found];
        saveNicknames(db);
        global.nicknamesDB = db;
        return m.reply(`> ✅ ** تم حذف لقبك (${found}) بنجاح`);
    }

    // .تسجيل — بدء التسجيل
    const sender = m.sender;
    global.nickRegState.set(sender, { step: 'awaiting_nickname' });

    return m.reply(
`> ❄️ *"تسجيل لقب جديد"*
> 
> 📝 *الخطوة 1/2:* اكتب لقبك
> 
> 💡 *مثال:* همام
> ⚠️ *ملاحظة:* اللقب يجب أن يكون فريداً
> 
> 🗑️ للإلغاء اكتب: إلغاء`
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// before — معالجة خطوات التسجيل + كشف الألقاب
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handler.before = async function (m, { conn }) {
    if (!m || !m.text === undefined) return false;

    const sender = m.sender;
    const state  = global.nickRegState?.get(sender);
    const db     = global.nicknamesDB;

    // ━━ معالجة خطوات التسجيل ━━
    if (state) {
        const text = (m.text || '').trim();

        // إلغاء
        if (/^(إلغاء|الغاء|cancel)$/i.test(text)) {
            global.nickRegState.delete(sender);
            await m.reply('> ❌ ** تم إلغاء التسجيل');
            return true;
        }

        // الخطوة 1: استلام اللقب
        if (state.step === 'awaiting_nickname' && text && !m.msg?.videoMessage && !m.msg?.audioMessage) {
            if (text.length > 20) {
                await m.reply('> ⚠️ ** اللقب طويل جداً، الحد الأقصى 20 حرف');
                return true;
            }

            const normNick = normalizeNick(text);

            // فحص إذا اللقب موجود
            if (db[normNick]) {
                await m.reply(`> ❌ ** اللقب "${text}" مسجل مسبقاً، اختر لقباً آخر`);
                return true;
            }

            // حفظ اللقب المؤقت والانتقال للخطوة 2
            global.nickRegState.set(sender, { step: 'awaiting_video', nickname: normNick, displayNick: text });

            await m.reply(
`> ✅ ** تم قبول اللقب: *${text}*
> 
> 🎬 *الخطوة 2/2:* أرسل الإيديت الخاص بك
> 
> ⏱️ *المدة القصوى:* 20 ثانية
> 📌 سيُرسل هذا الفيديو تلقائياً كملاحظة لكل من يذكر لقبك`
            );
            return true;
        }

        // الخطوة 2: استلام الفيديو
        if (state.step === 'awaiting_video') {
            const isVideo = m.mtype === 'videoMessage' || 
                           (m.mtype === 'extendedTextMessage' && false);
            
            if (!isVideo) {
                await m.reply('> ⚠️ ** أرسل فيديو فقط (إيديت)\n> 🗑️ للإلغاء اكتب: إلغاء');
                return true;
            }

            // فحص مدة الفيديو
            const duration = m.msg?.seconds || m.msg?.duration || 0;
            if (duration > 20) {
                await m.reply(`> ❌ ** الفيديو (${duration}ث) تجاوز الحد الأقصى 20 ثانية\n> 📌 أرسل فيديو أقصر`);
                return true;
            }

            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

            try {
                // تحميل وحفظ الفيديو
                const buffer   = await m.download();
                const nickHash = hashNick(state.nickname);
                const videoPath = path.join(VIDEOS_DIR, `${nickHash}.mp4`);
                fs.writeFileSync(videoPath, buffer);

                // حذف اللقب القديم لهذا العضو إن وجد
                const oldNick = Object.keys(db).find(k => db[k].jid === sender);
                if (oldNick) {
                    const oldPath = db[oldNick].videoPath;
                    if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                    delete db[oldNick];
                }

                // حفظ السجل الجديد
                db[state.nickname] = {
                    jid: sender,
                    displayNick: state.displayNick,
                    videoPath,
                    registeredAt: Date.now()
                };
                saveNicknames(db);
                global.nicknamesDB = db;

                global.nickRegState.delete(sender);

                await m.reply(
`> ✅ *"تم التسجيل بنجاح!"*
> 
> 🏷️ *لقبك:* ${state.displayNick}
> 🎬 *الإيديت:* محفوظ ✓
> 
> 📢 الآن أي شخص يذكر لقبك سيصله إيديتك تلقائياً!`
                );
            } catch (e) {
                console.error('[Nick] خطأ في حفظ الفيديو:', e.message);
                global.nickRegState.delete(sender);
                await m.reply('> ❌ ** فشل حفظ الإيديت، حاول مجدداً');
            }
            return true;
        }
    }

    // ━━ كشف الألقاب في رسائل الجروب ━━
    if (!m.isGroup) return false;
    if (!m.text)    return false;
    if (Object.keys(db).length === 0) return false;

    const msgText = m.text.toLowerCase();

    for (const [normNick, data] of Object.entries(db)) {
        // كشف اللقب مع أو بدون نقطة، ومع أو بدون مسافة
        const escaped = normNick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex   = new RegExp(`(^|\\s|\\.|@)${escaped}($|\\s|[^\\w])`, 'i');

        if (!regex.test(msgText)) continue;

        // تجاهل لو المرسل هو صاحب اللقب
        if (data.jid === m.sender) continue;

        // تحقق من وجود الفيديو
        if (!data.videoPath || !fs.existsSync(data.videoPath)) continue;

        try {
            // إرسال المنشن مع الإيديت
            await conn.sendMessage(m.chat, {
                text: `> 🏷️ *${data.displayNick}*`,
                mentions: [data.jid]
            });

            await conn.sendMessage(m.chat, {
                video: { url: data.videoPath },
                ptv: true
            }, { quoted: m });

        } catch (e) {
            console.error('[Nick] خطأ في إرسال الإيديت:', e.message);
        }

        break; // لقب واحد فقط لكل رسالة
    }

    return false;
};

handler.help    = ['تسجيل', 'لقبي', 'الالقاب', 'حذف_لقبي'];
handler.tags    = ['nickname'];
handler.command = /^(تسجيل|الالقاب|حذف_لقبي)$/i;

export default handler;