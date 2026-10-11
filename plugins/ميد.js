// plugins/mediafire_stream.js
// ⧼ 𝑷𝑹𝑶𝑻𝑶𝑻𝒀𝑷𝑬 ⧽ v2 - تحميل وإرسال من ميديا فاير

import fetch from 'node-fetch';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { theme } from '../core/theme.js';
import cheerio from 'cheerio';

// استخراج الرابط المباشر
async function getDirectUrl(mediafireUrl) {
    const res = await fetch(mediafireUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let directUrl = $('a[aria-label="Download file"]').attr('href');
    if (!directUrl) directUrl = $('#downloadButton').attr('href');
    if (!directUrl) directUrl = $('.download-link').attr('href');
    
    return directUrl;
}

let handler = async (m, { conn, args }) => {
    if (!args[0]) {
        return m.reply(theme.build([
            { type: 'title', text: '📁 ميديا فاير' },
            { type: 'line', text: '.ميديا [الرابط]' }
        ]));
    }

    await m.react('⏳');
    
    try {
        // استخراج الرابط المباشر
        let directUrl = await getDirectUrl(args[0]);
        if (!directUrl) throw new Error('لا يوجد رابط تحميل');
        
        // الحصول على معلومات الملف
        let headRes = await fetch(directUrl, { method: 'HEAD' });
        let size = headRes.headers.get('content-length');
        let sizeMB = size ? (parseInt(size) / 1024 / 1024).toFixed(2) : '???';
        let filename = directUrl.split('/').pop().split('?')[0] || 'file.mp4';
        
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})
        
        // ✅ الطريقة الأولى: تحميل على الهارد ثم إرسال ثم حذف
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
        let tempFile = `./temp/${Date.now()}_${filename}`;
        
        // تحميل الملف
        let fileRes = await fetch(directUrl);
        let writer = createWriteStream(tempFile);
        await pipeline(fileRes.body, writer);
        
        // إرسال الملف
        await conn.sendMessage(m.chat, {
            document: { url: tempFile },
            fileName: filename,
            mimetype: 'application/octet-stream',
            caption: theme.build([
                { type: 'success', text: '✅ تم التحميل' },
                { type: 'info', label: 'الحجم', value: `${sizeMB} MB` }
            ])
        });
        
        // حذف الملف بعد الإرسال
        fs.unlinkSync(tempFile);
        await m.react('✅');
        
    } catch (err) {
        console.error(err);
        await m.react('❌');
        m.reply(`❌ فشل التحميل: ${err.message}`);
    }
};

handler.command = ['ميديا', 'mediafire'];
export default handler;