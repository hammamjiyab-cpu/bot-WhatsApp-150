// commands/getstickerhash.js
import crypto from 'crypto';

let handler = async (m, { conn }) => {
    if (!m.quoted || !m.quoted.mimetype?.includes('webp')) {
        return m.reply('رد على استيكر');
    }
    
    let buffer = await m.quoted.download();
    let hash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    m.reply(`*بصمة الاستيكر:*\n\`\`\`${hash}\`\`\``);
};

handler.command = ['بصمة', 'stickerhash'];
export default handler;