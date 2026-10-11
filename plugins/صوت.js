// plugins/sound.js
// أمر جلب مؤثرات صوتية من MyInstants - مع أزرار تفاعلية

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

const BASE_URL = "https://www.myinstants.com";
const EGYPT_URL = `${BASE_URL}/en/index/eg/`;
const SEARCH_URL = `${BASE_URL}/en/search/?name=`;

let tempResults = new Map();
let lastSendTime = 0;
const MIN_DELAY = 8000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForSend() {
    const now = Date.now();
    const elapsed = now - lastSendTime;
    if (elapsed < MIN_DELAY) {
        const waitTime = MIN_DELAY - elapsed;
        console.log(`⏳ انتظار ${waitTime}ms...`);
        await delay(waitTime);
    }
    lastSendTime = Date.now();
}

async function downloadAudio(url) {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
}

async function searchSounds(query) {
    const url = `${SEARCH_URL}${encodeURIComponent(query)}`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    $('.instant').each((i, el) => {
        if (i >= 10) return;
        
        const $el = $(el);
        const title = $el.find('.instant-link').text().trim();
        const button = $el.find('.small-button');
        const onclick = button.attr('onclick') || '';
        const match = onclick.match(/play\(['"]([^'"]+)['"]/);
        
        if (match && match[1]) {
            let soundUrl = match[1];
            if (!soundUrl.startsWith('http')) {
                soundUrl = `${BASE_URL}${soundUrl.startsWith('/') ? '' : '/'}${soundUrl}`;
            }
            results.push({ title, url: soundUrl });
        }
    });
    
    return results;
}

async function getRandomEgyptianSounds() {
    const response = await fetch(EGYPT_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const sounds = [];
    
    $('.instant').each((i, el) => {
        const $el = $(el);
        const title = $el.find('.instant-link').text().trim();
        const button = $el.find('.small-button');
        const onclick = button.attr('onclick') || '';
        const match = onclick.match(/play\(['"]([^'"]+)['"]/);
        
        if (match && match[1]) {
            let soundUrl = match[1];
            if (!soundUrl.startsWith('http')) {
                soundUrl = `${BASE_URL}${soundUrl.startsWith('/') ? '' : '/'}${soundUrl}`;
            }
            sounds.push({ title, url: soundUrl });
        }
    });
    
    return sounds;
}

async function sendResultsAsButtons(conn, chatId, sender, query, results, quoted) {
    const buttons = results.slice(0, 5).map((sound, index) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: `${index + 1}. ${sound.title.substring(0, 35)}`,
            id: `sound_${index}`
        })
    }));
    
    // تخزين النتائج مؤقتاً مع معرف المستخدم
    const userKey = `${chatId}_${sender}`;
    tempResults.set(userKey, {
        results: results,
        timestamp: Date.now()
    });
    
    const interactiveMessage = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({
            text: `🎵 *نتائج البحث عن:* ${query}\n📊 *عدد النتائج:* ${results.length}\n\n👇 *اختر الصوت المطلوب:*`
        }),
        footer: proto.Message.InteractiveMessage.Footer.create({
            text: `⚡ PROTOTYPE-MD · MyInstants`
        }),
        header: proto.Message.InteractiveMessage.Header.create({
            hasMediaAttachment: false,
            title: '🎵 مؤثرات صوتية'
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: buttons,
            messageParamsJson: JSON.stringify({
                bottom_sheet: {
                    in_thread_buttons_limit: 5,
                    divider_indices: [1, 2, 3, 4, 5, 999],
                    list_title: '🎵 اختر الصوت',
                    button_title: '📥 اختيار'
                }
            })
        })
    });
    
    const msg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: {
            message: { interactiveMessage }
        }
    }, { quoted });
    
    await conn.relayMessage(chatId, msg.message, { messageId: msg.key.id });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 الأمر الرئيسي
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let handler = async (m, { conn, text, usedPrefix, command }) => {
    const react = async (emoji) => {
        try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }); } catch {}
    };

    // صوت عشوائي
    if (text && text.toLowerCase() === 'random') {
        await react('⏳');
        await m.reply(`🎲 *جلب صوت عشوائي...*`);
        
        const sounds = await getRandomEgyptianSounds();
        if (sounds.length === 0) throw new Error('مافيش أصوات');
        
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        
        try {
            const audioBuffer = await downloadAudio(randomSound.url);
            await waitForSend();
            
            await conn.sendMessage(m.chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${randomSound.title}.mp3`,
                caption: `> 🎵 *${randomSound.title}*\n> ⚡ PROTOTYPE-MD`
            }, { quoted: m });
            
            await react('✅');
        } catch (err) {
            await react('❌');
            await m.reply(`❌ *فشل:* ${err.message}`);
        }
        return;
    }
    
    // مساعدة
    if (!text) {
        await react('❌');
        return m.reply(
            `> ꒦꒷𓆩🎵𓆪꒷꒦
> 
> 🜲⃝☠️ *أمـر الـمـؤثـرات الـصـوتـيـة*
> 
> 👁️⃝🩸 *الاستخدام:*
> 👁️⃝🩸 \`${usedPrefix}${command} <كلمة البحث>\`
> 👁️⃝🩸 \`${usedPrefix}${command} random\`
> 
> 👁️⃝🩸 *أمثلة:*
> 👁️⃝🩸 \`${usedPrefix}${command} ضحك\`
> 👁️⃝🩸 \`${usedPrefix}${command} فاه\`
> 
> ꒦꒷𓆩☣️𓆪꒷꒦ ✧ 🩸 𖤐 🜲 ✧ ꒦꒷𓆩☣️𓆪꒷꒦`
        );
    }
    
    // بحث
    await react('🔍');
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})
    
    const sounds = await searchSounds(text);
    
    if (sounds.length === 0) {
        await react('❌');
        return m.reply(`❌ *مافيش نتائج لـ:* ${text}\n💡 جرب كلمة إنجليزية (مثل: laugh, boom)`);
    }
    
    // إرسال النتائج كأزرار تفاعلية
    await sendResultsAsButtons(conn, m.chat, m.sender, text, sounds, m);
    await react('✅');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 معالج الأزرار (handler.all) - الطريقة الصحيحة للتعامل مع ضغطات الأزرار
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
handler.all = async function (m) {
    try {
        let buttonId = null;
        
        // 1- للأزرار العادية
        if (m.message?.buttonsResponseMessage) {
            buttonId = m.message.buttonsResponseMessage.selectedButtonId;
        }
        // 2- للقوالب المباشرة
        else if (m.message?.templateButtonReplyMessage) {
            buttonId = m.message.templateButtonReplyMessage.selectedId;
        }
        // 3- للقوائم التفاعلية
        else if (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage) {
            buttonId = m.message.interactiveResponseMessage.nativeFlowResponseMessage.id;
        }
        // 4- للرسالة النصية العادية (كبديل)
        else if (m.text && m.text.startsWith('sound_')) {
            buttonId = m.text;
        }
        
        if (!buttonId) return false;
        
        // التحقق من أن الـ ID يبدأ بـ sound_
        if (!buttonId.startsWith('sound_')) return false;
        
        console.log('[SOUND BUTTON] Pressed:', buttonId);
        
        const index = parseInt(buttonId.split('_')[1]);
        if (isNaN(index)) return false;
        
        const userKey = `${m.chat}_${m.sender}`;
        const userResults = tempResults.get(userKey);
        
        if (!userResults || !userResults.results[index]) {
            await m.reply('❌ *انتهت صلاحية البحث، استخدم .صوت مرة أخرى*');
            return true;
        }
        
        const sound = userResults.results[index];
        tempResults.delete(userKey);
        
        await this.sendMessage(m.chat, { react: { text: "⏳", key: m.key } }).catch(() => {});
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})
        
        try {
            const audioBuffer = await downloadAudio(sound.url);
            await waitForSend();
            
            await this.sendMessage(m.chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${sound.title}.mp3`,
                caption: `> 🎵 *${sound.title}*\n> ⚡ PROTOTYPE-MD`
            }, { quoted: m });
            
            await this.sendMessage(m.chat, { react: { text: "✅", key: m.key } }).catch(() => {});
        } catch (err) {
            console.error(err);
            await this.sendMessage(m.chat, { react: { text: "❌", key: m.key } }).catch(() => {});
            await m.reply(`❌ *فشل:* ${err.message}`);
        }
        
        return true;
        
    } catch (err) {
        console.error('[SOUND BUTTON ERROR]', err);
        return false;
    }
};

handler.command = /^(صوت|مؤثر|ساوند|sound)$/i;
export default handler;