/*╭━━━〔 CREDITS FOR Hammam 〕━━━╮
│ 👑 الـمـطـور ↜ 𝙔𝙖𝙢𝙞 🐉
│ 🌾 قــنــاة الــمــطـور ↜ global.CHANNEL_LINK
الوظيفه: تحميل ملفات Apk
╰━━━━━━━━━━━━━━━━━━╯
*/

import fetch from 'node-fetch';

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) {
    return conn.sendMessage(m.chat, {
      text: `╭━❪ 𖤐 Hammam Bot 𖤐 ❫━╮
│
│ 🜲⃝📦 *تـحـمـيـل تـطـبـيـقـات APK*
│ 🜲⃝📱 *مـع مـلـفـات OBB إن وجـدت*
│
│ ⚡⃝🜲 *الاستخدام:*
│ *${usedPrefix}apk ⧼ اسم التطبيق ⧽*
│
│ 📌 *مثال:*
│ *${usedPrefix}apk free fire*
│
╰━❪ 𖤐 Hammam Bot 𖤐 ❫━╯`,
      contextInfo: {
        externalAdReply: {
          title: "🜲⃝🇾🇪  Hammam Bot - 𝐌𝐃",
          body: "⚝ 𖤐⃝🐉 Hammam SYSTEM ACTIVATED",
          mediaType: 1,
          thumbnail: await getThumbnail(),
          mediaUrl: global.CHANNEL_LINK,
          sourceUrl: global.CHANNEL_LINK
        }
      }
    }, { quoted: m });
  }

  if (/^com\./i.test(text.trim())) {
    await conn.sendMessage(m.chat, { react: { text: '⏬', key: m.key } });
    
    try {
      const info = await getAppInfo(text.trim());
      const res = await downloadApp(text.trim());

      if (res.size > 2000000000) {
        return conn.sendMessage(m.chat, { text: '❌⃝🇾🇪 *حجم ملف APK كبير جداً*\n🜲⃝🐉 *الحد الأقصى: 2GB*' }, { quoted: m });
      }

      await conn.sendMessage(m.chat, {
        image: { url: info.icon },
        caption: `╭━❪ 𖤐 Hammam Bot 𖤐 ❫━╮
│
│ 📱⃝🜲 *الاسم:* ${info.name}
│ 📦⃝🜲 *الحزمة:* ${info.packageN}
│
│ 🇾🇪🩸 *جـاري تـحـمـيـل الـمـلـف...*
│
╰━❪ 𖤐 Hammam Bot 𖤐 ❫━╯`,
        footer: '𖤐 Hammam Bot - 𝐌𝐃',
        quoted: m
      });

      await conn.sendMessage(
        m.chat,
        { 
          document: { url: res.download }, 
          mimetype: res.mimetype, 
          fileName: res.fileName 
        },
        { quoted: m }
      );

      if (info.obb) {
        await conn.sendMessage(m.chat, { text: `📦⃝❄️ *جـاري تـحـمـيـل مـلـف OBB لـ ${info.name}...*` }, { quoted: m });

        const obbRes = await fetch(info.obb_link, { method: 'HEAD' });
        const obbMimetype = obbRes.headers.get('content-type');
        const obbFileName = decodeURIComponent(info.obb_link.split('/').pop().split('?')[0]);

        await conn.sendMessage(
          m.chat,
          { 
            document: { url: info.obb_link }, 
            mimetype: obbMimetype, 
            fileName: obbFileName 
          },
          { quoted: m }
        );
      }

    } catch (e) {
      console.error(e);
      await conn.sendMessage(m.chat, { text: '❌⃝🇾🇪 *فـشـل فـي تـحـمـيـل APK*' }, { quoted: m });
    }
    return;
  }

  await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
  
  try {
    const apps = await searchApps(text);
    if (!apps.length) {
      return conn.sendMessage(m.chat, { text: '❌⃝🐉 *لـم يـتـم الـعـثـور عـلى أي تـطـبـيـقـات*' }, { quoted: m });
    }

    let generateWAMessageFromContent, proto;
    try {
      let baileysLib;
      try { baileysLib = await import('@whiskeysockets/baileys') }
      catch { baileysLib = await import('@whiskeysockets/baileys') }

      generateWAMessageFromContent = baileysLib?.generateWAMessageFromContent || baileysLib?.default?.generateWAMessageFromContent;
      proto = baileysLib?.proto || baileysLib?.default?.proto;
    } catch (e) {
      console.error(e);
    }

    if (generateWAMessageFromContent && proto) {
      const buttons = [
        {
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "🐉 اضغط لعرض النتائج",
            sections: [
              {
                title: `📱 نتائج البحث عن: ${text}`,
                rows: apps.map((app) => ({
                  title: app.name.slice(0, 24),
                  description: app.package.slice(0, 48),
                  id: `${usedPrefix}apk ${app.package}`,
                })),
              },
            ],
          }),
        },
      ];

      const msg = generateWAMessageFromContent(
        m.chat,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
              interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                body: proto.Message.InteractiveMessage.Body.create({ 
                  text: `╭━❪ 𖤐 Hammam Bot 𖤐 ❫━╮\n│\n│ 🔍⃝🇾🇪 *بـحـث عـن:* ${text}\n│ 📱⃝🜲 *اخـتـر تـطـبـيـق لـتـحـمـيـلـه*\n│\n╰━❪ 𖤐 Hammam Bot 𖤐 ❫━╯` 
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: "© ʙʏ ༺ 𝙔𝙖𝙢𝙞 🐉 ༻" }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons }),
              }),
            },
          },
        },
        {}
      );

      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
      return;
    }

    // احتياطي نصي إذا كان الإصدار لا يدعم الأزرار التفاعلية
    let fallbackTxt = `╭━❪ 𖤐 Hammam Bot 𖤐 ❫━╮\n│ 🔍⃝🇾🇪 *نتائج البحث عن:* ${text}\n╰━❪ 𖤐 Hammam Bot 𖤐 ❫━╯\n\n`;
    apps.forEach((app, i) => {
      fallbackTxt += `*${i + 1}.* ${app.name}\n📦 *الحزمة:* ${app.package}\n🔗 *للتحميل:* ${usedPrefix}apk ${app.package}\n\n`;
    });
    await conn.sendMessage(m.chat, { text: fallbackTxt.trim() }, { quoted: m });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, { text: '🥶 *حـدث خـطـأ أثـنـاء الـبـحـث*' }, { quoted: m });
  }
};

async function searchApps(query) {
  const res = await fetch('http://ws75.aptoide.com/api/7/apps/search?query=' + encodeURIComponent(query) + '&limit=10');
  const json = await res.json();
  return json.datalist.list.map(app => ({
    name: app.name,
    package: app.package
  }));
}

async function getAppInfo(packageName) {
  const res = await fetch('http://ws75.aptoide.com/api/7/apps/search?query=' + encodeURIComponent(packageName) + '&limit=1');
  const json = await res.json();
  const app = json.datalist.list[0];

  if (!app) throw '❌ لم يتم العثور على التطبيق';

  let obb_link, obb = false;
  try {
    obb_link = app.obb.main.path;
    obb = true;
  } catch {
    obb_link = null;
  }

  return {
    obb,
    obb_link,
    name: app.name,
    icon: app.icon,
    packageN: app.package
  };
}

async function downloadApp(packageName) {
  const res = await fetch('http://ws75.aptoide.com/api/7/apps/search?query=' + encodeURIComponent(packageName) + '&limit=1');
  const json = await res.json();
  const app = json.datalist.list[0];

  const download = app.file.path;
  const fileName = app.package + '.apk';
  const head = await fetch(download, { method: 'HEAD' });
  const size = head.headers.get('content-length');
  const mimetype = head.headers.get('content-type');

  return { fileName, mimetype, download, size };
}

async function getThumbnail() {
  try {
    const res = await fetch('https://files.catbox.moe/7h727z.mp4');
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

handler.command = ['apk'];

export default handler;