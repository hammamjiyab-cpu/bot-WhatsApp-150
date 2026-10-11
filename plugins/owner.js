// plugins/owner.js
// Hammam Bot- معلومات المطور 👑

const VIDEOS = [
    'https://file.garden/aopbTIvyBCZ1OfsC/VID_20260825_035535_674.mp4',
    'https://file.garden/aopbTIvyBCZ1OfsC/VID_20260825_035539_926.mp4'
];

// يتبادل بين الفيديوين بدل العشوائي الكاذب
let lastVideoIndex = -1;

let handler = async (m, { conn }) => {
    const imageUrl = 'https://file.garden/aopbTIvyBCZ1OfsC/file_00000000fe70820a9754c62ac6c1ce00.png';

    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:Hammam Bot \nTEL;type=CELL;waid=${String(global.owner?.[0] || '')}:+${String(global.owner?.[0] || '')}\nEND:VCARD`;

    const qkontak = {
        key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
        message: { contactMessage: { displayName: "Hammam Bot ", vcard } }
    };

    const devText = `╭━━━〔 👑 *بطاقة المطور* 〕━━━╮\n\n` +
        `👤 *الاسم:* Hammam Bot\n` +
        `📞 *الرقم:* https://wa.me/${String(global.owner?.[0] || '')}\n` +
        `💬 *التواصل:* @${String(global.owner?.[0] || '')}\n` +
        `📢 *القناة:* ${global.CHANNEL_LINK}\n\n` +
        `⚡ *عبارة الثقة:*\n` +
        `_«نحن لا نتبع الأثر، بل نترك الأثر ليتبعه الآخرون.»_\n\n` +
        `📖 *عبارة إيمانية:*\n` +
        `_«وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ»_\n\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`;

    // 1. الصورة مع بطاقة المطور
    try {
        await conn.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: devText,
            mentions: [((String(global.owner?.[0] || ''))+'@s.whatsapp.net')]
        }, { quoted: qkontak });
    } catch {
        await conn.sendMessage(m.chat, {
            text: devText,
            mentions: [((String(global.owner?.[0] || ''))+'@s.whatsapp.net')]
        }, { quoted: qkontak });
    }

    // 2. تبادل بين الفيديوين — يضمن إرسال مختلف كل مرة
    lastVideoIndex = (lastVideoIndex + 1) % VIDEOS.length;
    const videoUrl = VIDEOS[lastVideoIndex];

    try {
        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            ptv: true
        }, { quoted: m });
    } catch (e) {
        console.error('[Owner] video error:', e.message);
    }
};

handler.help = ['owner', 'creator'];
handler.tags = ['main'];
handler.command = /^(owner|creator|المطورين|المطور|مطور|مطورك|مطوري|همام|creador)$/i;

export default handler;