// plugins/pinterest.js
// Hammam Bot- Pinterest 📌

import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import { unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  proto,
  generateWAMessageFromContent,
  generateWAMessageContent,
} from "@whiskeysockets/baileys"
import { theme } from '../core/theme.js'

const execAsync = promisify(exec)
const YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp'
const COOKIES_PATH = `${process.cwd()}/cookies/pinterest.txt`

// ═══════════════════════════════════════
// سكرابر Pinterest الرسمي
// ═══════════════════════════════════════
const PINTEREST_BASE = 'https://www.pinterest.com'
const PINTEREST_SEARCH_PATH = '/resource/BaseSearchResource/get/'
const PINTEREST_HEADERS = {
   accept: 'application/json, text/javascript, */*, q=0.01',
   referer: 'https://www.pinterest.com/',
   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
   'x-app-version': 'a9522f',
   'x-pinterest-appstate': 'active',
   'x-pinterest-pws-handler': 'www/[username]/[slug].js',
   'x-requested-with': 'XMLHttpRequest'
}

async function getPinterestCookies() {
   try {
      const res = await axios.get(PINTEREST_BASE, { timeout: 15000 })
      const setCookies = res.headers['set-cookie']
      if (!setCookies) return null
      return setCookies.map(c => c.split(';')[0].trim()).join('; ')
   } catch {
      return null
   }
}

async function searchPinterest(query, needed = 30) {
   const images = []
   const cookies = await getPinterestCookies()
   if (!cookies) return images

   let bookmarks = ['']
   let attempts = 0
   const maxAttempts = 10

   while (images.length < needed && bookmarks.length && attempts < maxAttempts) {
      attempts++
      try {
         const params = {
            source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
            data: JSON.stringify({
               options: { isPrefetch: false, query, scope: 'pins', bookmarks, page_size: 50 },
               context: {}
            }),
            _: Date.now()
         }

         const { data } = await axios.get(`${PINTEREST_BASE}${PINTEREST_SEARCH_PATH}`, {
            headers: { ...PINTEREST_HEADERS, cookie: cookies },
            params,
            timeout: 15000
         })

         const results = data?.resource_response?.data?.results?.filter(v => v?.images?.orig?.url) || []
         if (!results.length) break

         for (const r of results) {
            images.push(r.images.orig.url)
            if (images.length >= needed) break
         }

         const nextBookmark = data?.resource_response?.bookmark
         if (!nextBookmark || nextBookmark === '-end-') break
         bookmarks = [nextBookmark]
      } catch {
         break
      }
   }

   return [...new Set(images)].slice(0, needed)
}

// ═══════════════════════════════════════
// Handler
// ═══════════════════════════════════════
let handler = async (m, { conn, text, usedPrefix, command }) => {

  const react = async (emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
  }

  if (!text) {
    return m.reply(theme.build([
      { type: 'title', text: '📌 Pinterest - Hammam Bot' },
      { type: 'divider' },
      { type: 'info', label: '🔍 بحث صور', value: `${usedPrefix + command} <كلمة>` },
      { type: 'info', label: '📌 تحميل فيديو', value: `${usedPrefix + command} <رابط>` }
    ]))
  }

  // تحميل فيديو من الرابط
  if (text.includes('pin.it') || text.includes('pinterest.com/pin/')) {
    await react('⏳')
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

    try {
      const outputPath = join(tmpdir(), `pin_${Date.now()}.mp4`)
      const cmd = `export PATH=$HOME/.deno/bin:$PATH && ${YTDLP_PATH} -o ${outputPath} ${text} --cookies ${COOKIES_PATH} --no-playlist --force-overwrites --no-cookies --sleep-interval 5 --user-agent "Mozilla/5.0"`
      await execAsync(cmd, { timeout: 180000 })

      if (!existsSync(outputPath)) throw new Error('فشل')
      const sizeMB = ((await (await import('fs')).statSync(outputPath)).size / 1048576).toFixed(2)

      await conn.sendMessage(m.chat, {
        video: { url: outputPath },
        caption: `✅ تم التحميل بواسطة Hammam Bot | ${sizeMB} MB`
      }, { quoted: m })
      await react('✅')
      try { unlinkSync(outputPath) } catch {}
    } catch (e) {
      await react('❌')
      m.reply('❌ فشل التحميل')
    }
    return
  }

  // بحث صور
  await react('🔍')
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

  try {
    const images = await searchPinterest(text, 30)

    if (!images || images.length === 0) {
      await react('❌')
      return m.reply('❌ لا توجد نتائج')
    }

    let cards = []
    
    for (let i = 0; i < images.length; i++) {
      try {
        const imgRes = await axios.get(images[i], { 
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 15000
        })
        
        const buffer = Buffer.from(imgRes.data)
        if (buffer.length < 1000) continue
        
        const { imageMessage } = await generateWAMessageContent(
          { image: buffer },
          { upload: conn.waUploadToServer }
        )
        
        if (!imageMessage) continue

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({ 
            text: `📸 صورة ${i + 1} | 🔎 ${text}` 
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({ 
            hasMediaAttachment: true,
            imageMessage: imageMessage 
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [{
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "📌 فتح في Pinterest",
                url: 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(text)
              })
            }]
          })
        })
      } catch (e) { 
        continue 
      }
    }

    if (cards.length === 0) {
      await react('❌')
      return m.reply('❌ فشل تحميل الصور')
    }

    const finalMessage = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        body: proto.Message.InteractiveMessage.Body.create({
          text: `🔍 نتائج: ${text}\n📸 ${cards.length} صورة\n⚡Hammam Bot`
        }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark }),
        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
      })}}
    }, { quoted: m })

    await conn.relayMessage(m.chat, finalMessage.message, { messageId: finalMessage.key.id })
    await react('✅')

  } catch (e) {
    console.error(e)
    await react('❌')
    m.reply('❌ خطأ في البحث')
  }
}

handler.help = ['بنترست']
handler.tags = ['downloader']
handler.command = /^(بنترست|بينترست|بينتر|pinterest)$/i

export default handler