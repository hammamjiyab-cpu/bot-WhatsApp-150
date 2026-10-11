// plugins/nixcode-demo.js
// ✧ Hammam Bot - عرض جميع أنواع الأزرار 🔘

import { Button, ButtonV2, Carousel } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

  // ═══════════════════════════════════════
  // 1️⃣ زر عادي + قائمة منسدلة + URL + Copy
  // ═══════════════════════════════════════
  await new Button(conn)
    .setTitle('❄️ Hammam Bot ')
    .setSubtitle('الأزرار التفاعلية')
    .setBody('اختر من القائمة أدناه')
    .setFooter('❄️ Hammam Bot ❄️')
    .setImage('https://file.garden/aopbTIvyBCZ1OfsC/568650.jpg')
    .addReply('📂 الأقسام', '.اوامر')
    .addReply('👤 المطور', '.المطور')
    .addUrl('📢 القناة', global.CHANNEL_LINK, true)
    .addCopy('📋 نسخ الرقم', ('+'+String(global.owner?.[0] || '')))
    .addSelection('📚 اختر القسم')
    .makeSection('الأقسام الرئيسية')
    .makeRow('👮‍♂️', 'قسم الأدمن', 'أوامر المشرفين', '.ق1')
    .makeRow('🎨', 'قسم الاستيكر', 'الملصقات', '.ق2')
    .makeRow('🎮', 'قسم الألعاب', 'ألعاب تفاعلية', '.ق3')
    .send(m.chat, { quoted: m })

  // ═══════════════════════════════════════
  // 2️⃣ أزرار عائمة (Floating)
  // ═══════════════════════════════════════
  await new ButtonV2(conn)
    .setTitle('❄️ Hammam Bot ')
    .setSubtitle('أزرار عائمة')
    .setBody('هذه أزرار منفصلة عن النص')
    .setFooter('❄️ Hammam Bot ❄️')
    .setThumbnail('https://i.ibb.co/C58jbZpc/568651.jpg')
    .addRawButton({
      buttonText: { displayText: '📂 الأقسام' },
      buttonId: 'menu',
      type: 1,
      nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: "اختر القسم",
          sections: [{
            title: "الأقسام",
            rows: [
              { title: "👮‍♂️ قسم الأدمن", description: "أوامر المشرفين", id: ".ق1" },
              { title: "🎨 قسم الاستيكر", description: "الملصقات", id: ".ق2" },
              { title: "🎮 قسم الألعاب", description: "ألعاب تفاعلية", id: ".ق3" }
            ]
          }]
        })
      }
    })
    .addButton('👤 المطور', '.المطور')
    .addButton('⭐ تقييم', '.تقييم')
    .send(m.chat)

  // ═══════════════════════════════════════
  // 3️⃣ كاروسيل (سلايدر)
  // ═══════════════════════════════════════
  await new Carousel(conn)
    .setBody('🎮 أقسام Hammam Bot ')
    .setFooter('❄️ اسحب للتصفح ❄️')
    .addCard(
      await new Button(conn)
        .setTitle('👮‍♂️ قسم الأدمن')
        .setBody('أوامر المشرفين')
        .setImage('https://i.ibb.co/xKK04wzw/565004.jpg')
        .addReply('📂 فتح', '.ق1')
        .toCard()
    )
    .addCard(
      await new Button(conn)
        .setTitle('🎮 قسم الألعاب')
        .setBody('ألعاب تفاعلية')
        .setImage('https://i.ibb.co/cd1z6L4/565008.jpg')
        .addReply('🎮 فتح', '.ق3')
        .toCard()
    )
    .addCard(
      await new Button(conn)
        .setTitle('🎉 قسم التسلية')
        .setBody('ترفيه وألعاب')
        .setImage('https://i.ibb.co/ymNmxtcL/532523.jpg')
        .addReply('🎉 فتح', '.ق10')
        .toCard()
    )
    .send(m.chat, { quoted: m })

}

handler.help = ['نيوكس']
handler.tags = ['tools']
handler.command = /^(نيوكس|nixcode|demo)$/i

export default handler
