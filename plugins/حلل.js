// Hammam Bot- فحص الروابط ✧
// مهمة: تحليل الروابط والكشف عن التهديدات 🛡️

import axios from 'axios';
import { theme } from "../core/theme.js";

let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (!text) {
        await m.react('✍️');
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '🔮 "وحدة فحص الروابط"' },
            { type: 'spacer' },
            { type: 'info', label: '📌 الهدف', value: `حدد الرابط المراد فحصه` },
            { type: 'spacer' },
            { type: 'info', label: '⚔️ مثال', value: `${usedPrefix + command} https://google.com` }
        ]), m);
    }

    if (!/^https?:\/\//i.test(text)) {
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '❄️ "بروتوكول غير صالح"' },
            { type: 'spacer' },
            { type: 'warning', text: 'يجب أن يبدأ الرابط بـ http:// أو https://' }
        ]), m);
    }

    await m.react('⏳');
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

    try {
        // ━━━ قاعدة بيانات التهديدات ━━━
        const suspiciousWords = [
            "login", "verify", "account", "bank", "secure", "update",
            "free", "gift", "bonus", "earn", "crypto", "bitcoin", "pubg",
            "whatsapp", "instagram", "facebook", "password", "username",
            "confirm", "alert", "security", "verify", "unlock", "claim"
        ];

        // ━━━ مختصري الروابط المشبوهين ━━━
        const shorteners = [
            "bit.ly", "tinyurl", "cutt.ly", "t.co", "goo.gl", "shorturl",
            "is.gd", "ow.ly", "buff.ly", "adf.ly", "shorte.st", "bc.vc",
            "u.to", "cli.gs", "urls.im", "short.com", "short.io"
        ];

        let isThreat = false;
        let threatReport = [];

        // 1. فحص الكلمات المفتاحية المشبوهة
        for (let word of suspiciousWords) {
            if (text.toLowerCase().includes(word)) {
                isThreat = true;
                threatReport.push(`كلمة مفتاحية مشبوهة: "${word}"`);
                break;
            }
        }

        // 2. فحص الروابط المختصرة
        if (!isThreat) {
            for (let short of shorteners) {
                if (text.includes(short)) {
                    isThreat = true;
                    threatReport.push(`رابط مختصر (تمويه محتمل): ${short}`);
                    break;
                }
            }
        }

        // 3. فحص عناوين IP المباشرة
        if (!isThreat && /https?:\/\/\d+\.\d+\.\d+\.\d+/.test(text)) {
            isThreat = true;
            threatReport.push("يستخدم عنوان IP مباشر (نمط هجومي)");
        }

        // 4. فحص النطاقات المشبوهة
        const domainMatch = text.match(/https?:\/\/([^\/]+)/);
        if (domainMatch && !isThreat) {
            const domain = domainMatch[1];
            if (domain.split('.').length > 3) {
                isThreat = true;
                threatReport.push(`نطاق فرعي متعدد (تصيد محتمل): ${domain}`);
            }
        }

        // 5. فحص استجابة الهدف
        let targetStatus = "غير متاح";
        try {
            const res = await axios.get(text, {
                timeout: 8000,
                maxRedirects: 5,
                validateStatus: () => true
            });
            targetStatus = `${res.status} ${res.statusText || 'OK'}`;
            
            if (res.status >= 400) {
                isThreat = true;
                threatReport.push(`الهدف لا يستجيب بشكل طبيعي (HTTP ${res.status})`);
            }
        } catch (e) {
            targetStatus = "غير مستجيب أو محظور";
            if (!isThreat) {
                isThreat = true;
                threatReport.push("الهدف لا يستجيب - احتمال وجود حماية أو حظر");
            }
        }

        await m.react(isThreat ? '⚠️' : '✅');

        const missionResult = isThreat ? '⚠️ "تم اكتشاف تهديد!"' : '✅ "الهدف يبدو آمناً"';

        conn.reply(m.chat, theme.build([
            { type: 'title', text: missionResult },
            { type: 'spacer' },
            { type: 'info', label: '🌐 الهدف', value: text.slice(0, 60) + (text.length > 60 ? '...' : '') },
            { type: 'info', label: '🔎 حالة الاتصال', value: targetStatus },
            { type: 'divider' },
            { type: 'info', label: '🛡️ تقرير المهمة', value: isThreat ? threatReport.join(' | ') : "لم يتم اكتشاف تهديدات مباشرة" },
            { type: 'spacer' },
            { type: 'info', label: '❄️', value: 'Hammam Bot' }
        ]), m);

    } catch (err) {
        await m.react('❌');
        console.error("[LINKSCAN] فشل الفحص:", err);
        
        conn.reply(m.chat, theme.build([
            { type: 'title', text: '❄️ "فشلت مهمة الفحص"' },
            { type: 'spacer' },
            { type: 'warning', text: 'حدث خطأ أثناء محاولة الاتصال بالهدف' },
            { type: 'spacer' },
            { type: 'line', text: '💡 تأكد من صحة الرابط وأعد المحاولة' }
        ]), m);
    }
};

handler.help = ['فحص [رابط]'];
handler.tags = ['tools'];
handler.command = /^(حلل|فحص_رابط|checklink|scan|فحص)$/i;

export default handler;