import axios from 'axios';
import cheerio from 'cheerio';
import FormData from 'form-data';
import { webp2mp4 } from '../Z/webp2mp4.js';

let handler = async (m, { conn, text, command }) => {
 
 if (!m.quoted) return m.reply(' رد علي الاستيكر ~');

 if (!/webp/.test(m.quoted.mimetype)) return m.reply(`ذا مو استيكر`);

 const buffer = await m.quoted.download();;
 let smp4 = await webp2mp4(buffer)
 
 await conn.sendMessage(m.chat, {
      video: smp4,
      caption: `> *تم*`,
    }, { quoted: m });
}

handler.usage = ["لفيديو"];
handler.category = "tools";
handler.command = /^(tovideo|tovid|tomp4|لفيديو)$/i

export default handler