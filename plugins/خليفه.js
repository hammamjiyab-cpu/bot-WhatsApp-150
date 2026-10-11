// plugins/خلفيات.js
// Hammam Bot- بحث خلفيات 🖼️

import fetch from "node-fetch"
import {
  proto,
  generateWAMessageFromContent,
  generateWAMessageContent,
} from "@whiskeysockets/baileys"
import { theme } from '../core/theme.js'

// تخزين الصفحة الحالية لكل بحث
const searchPages = new Map()

let handler = async (m, { conn, text, usedPrefix, command }) => {

  const react = async (emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
  }

  // ─── التحقق من وجود صفحة مخزنة لهذا البحث ───
  let currentPage = 1
  if (searchPages.has(m.sender + '_' + text)) {
    currentPage = searchPages.get(m.sender + '_' + text) + 1
  }
  searchPages.set(m.sender + '_' + text, currentPage)

  if (!text) {
    react('❌')
    return m.reply(theme.build([
      { type: 'title', text: '🖼️ "وحدة بحث الخلفيات"' },
      { type: 'divider' },
      { type: 'line', text: '🔮 *بحث صور وخلفيات من Pinterest*' },
      { type: 'divider' },
      { type: 'info', label: '⚔️ الاستخدام', value: `${usedPrefix + command} <كلمة البحث>` },
      { type: 'spacer' },
      { type: 'info', label: '📌 أمثلة', value: '' },
      { type: 'line', text: `${usedPrefix + command} انمي` },
      { type: 'line', text: `${usedPrefix + command} طبيعة` },
      { type: 'line', text: `${usedPrefix + command} سيارات` }
    ]))
  }

  react('🔍')
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

  try {
    // إضافة رقم الصفحة للحصول على نتائج مختلفة
    const images = await searchPinterest(text, currentPage)

    if (!images || images.length === 0) {
      react('❌')
      return m.reply(theme.build([
        { type: 'title', text: '❄️ "لا توجد نتائج"' },
        { type: 'spacer' },
        { type: 'warning', text: `لم يتم العثور على نتائج للبحث: ${text}` }
      ]))
    }

    // ─── تجهيز الكاروسيل ────────────────
    let cards = []
    let counter = 1

    for (let imageUrl of images.slice(0, 10)) {
      try {
        const imgRes = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36' }
        })

        if (!imgRes.ok) continue

        const buffer = Buffer.from(await imgRes.arrayBuffer())
        if (buffer.length < 1000) continue

        const { imageMessage } = await generateWAMessageContent(
          { image: buffer },
          { upload: conn.waUploadToServer }
        )

        if (!imageMessage) continue

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: `🖼️ *خلفية ${counter}*\n🔍 *البحث:* ${text}\n📄 *صفحة:* ${currentPage}`
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            hasMediaAttachment: true,
            imageMessage: imageMessage
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [{
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🔄 مزيد من الخلفيات",
                id: `${usedPrefix + command} ${text}`
              })
            }]
          })
        })

        counter++
      } catch {
        continue
      }
    }

    if (cards.length === 0) {
      react('❌')
      return m.reply(theme.build([
        { type: 'title', text: '❄️ "فشلت مهمة تجهيز الصور"' },
        { type: 'spacer' },
        { type: 'warning', text: 'حدث خطأ أثناء معالجة الصور' }
      ]))
    }

    // ─── إرسال الكاروسيل ────────────────
    const finalMessage = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({
              text: theme.build([
                { type: 'title', text: '🖼️ "نتائج مهمة البحث"' },
                { type: 'info', label: '🎯 البحث', value: text },
                { type: 'info', label: '📊 النتائج', value: `${cards.length} خلفية` },
                { type: 'info', label: '📄 الصفحة', value: currentPage }
              ])
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
              cards: cards
            })
          })
        }
      }
    }, { quoted: m })

    await conn.relayMessage(m.chat, finalMessage.message, { messageId: finalMessage.key.id })
    react('✅')

  } catch (e) {
    console.error('❌ Hammam Bot - خلفيات Error:', e)
    react('❌')
    m.reply(theme.build([
      { type: 'title', text: '❄️ "فشلت مهمة البحث"' },
      { type: 'spacer' },
      { type: 'warning', text: `خطأ: ${e.message}` }
    ]))
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🔍 بحث بينترست مع دعم الصفحات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function searchPinterest(query, page = 1) {
  try {
    // إضافة معامل عشوائي للحصول على نتائج مختلفة
    const randomSeed = Date.now() + Math.random()
    const offset = (page - 1) * 20
    
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}&rs=typed&offset=${offset}&_=${randomSeed}`
    
    console.log('🔍 Hammam Bot Searching:', url)

    const sessionRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    })

    if (sessionRes.ok) {
      const html = await sessionRes.text()
      
      // أنماط مختلفة للصور للحصول على نتائج متنوعة
      const patterns = [
        /https:\/\/i\.pinimg\.com\/(?:originals|736x|564x)\/[^\s"'\\><]+\.(?:jpg|png|jpeg)/gi,
        /https:\/\/i\.pinimg\.com\/[0-9]+x\/[^\s"'\\><]+\.(?:jpg|png|jpeg)/gi
      ]
      
      let allMatches = []
      for (const pattern of patterns) {
        const matches = html.match(pattern)
        if (matches) allMatches.push(...matches)
      }
      
      if (allMatches.length > 3) {
        // إزالة التكرارات
        const unique = [...new Set(allMatches)]
        console.log('✅ Hammam Bot Found:', unique.length, 'images')
        return unique.slice(0, 15)
      }
    }
  } catch (e) {
    console.log('❌ Hammam Bot Pinterest error:', e.message)
  }

  // ─── بديل: Unsplash مع صفحة مختلفة ────
  try {
    const unsplashUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=15&page=${page}`
    console.log('🔍 Hammam Bot Trying Unsplash page', page)
    
    const res = await fetch(unsplashUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    })

    if (res.ok) {
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        const imgs = data.results
          .map(photo => photo.urls?.regular || photo.urls?.small)
          .filter(Boolean)
        if (imgs.length > 0) {
          console.log('✅ Hammam Bot Unsplash:', imgs.length)
          return imgs
        }
      }
    }
  } catch (e) {
    console.log('❌ Hammam Bot Unsplash:', e.message)
  }

  return null
}

handler.help = ['خلفيات <بحث>']
handler.tags = ['downloader']
handler.command = /^(خلفيات|خالفيات|خلفيه|خلفية|wallpaper)$/i

export default handler;