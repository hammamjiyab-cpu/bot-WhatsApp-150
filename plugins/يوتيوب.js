// plugins/يوتيوب.js
// Hammam Bot- YouTube Downloader 🎬

import { generateWAMessageFromContent, proto, prepareWAMessageMedia } from '@whiskeysockets/baileys'
import { theme } from '../core/theme.js'
import fetch from 'node-fetch'
import yts from 'yt-search'

const SERVER = 'http://132.243.253.240:2326'
const KEY = 'Hammam Bot - Hammam-SC-Downloader-2024'

async function quickDownload(url, type, quality) {
  const dlUrl = `${SERVER}/dl?key=${KEY}&url=${encodeURIComponent(url)}&type=${type}&quality=${quality}`
  const res = await fetch(dlUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(theme.build([
      { type: 'title', text: '🎬 Hammam Bot - يـوتـيـوب' },
      { type: 'divider' },
      { type: 'info', label: '🔗 رابط', value: `${usedPrefix + command} <رابط يوتيوب>` },
      { type: 'info', label: '🔍 بحث', value: `${usedPrefix + command} <اسم الفيديو>` }
    ]))
  }

  if (text.startsWith('dl_')) {
    let parts = text.split('_')
    let type = parts[1]
    let quality = parts[2]
    let url = parts.slice(3).join('_')
    await downloadAndSend(m, conn, url, type, quality)
    return
  }

  if (text.startsWith('select_')) {
    let parts = text.split('_')
    let searchId = parts[1]
    let index = parseInt(parts[2])
    let results = global.ytSearchResults?.[searchId]
    if (!results || !results[index]) {
      return m.reply(theme.build([{ type: 'title', text: '⏰ Hammam Bot - انتهت الصلاحية' }]))
    }
    await showQualityMenu(m, conn, results[index].url, usedPrefix, command)
    return
  }

  if (text.includes('youtu.be') || text.includes('youtube.com')) {
    await showQualityMenu(m, conn, text, usedPrefix, command)
    return
  }

  await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

  try {
    let searchResults = await yts(text)
    let videos = searchResults.videos.slice(0, 6)

    if (!videos || videos.length === 0) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return m.reply(theme.build([{ type: 'title', text: '❌ Hammam Bot - لا توجد نتائج' }]))
    }

    global.ytSearchResults = global.ytSearchResults || {}
    let searchId = Date.now()
    global.ytSearchResults[searchId] = videos
    setTimeout(() => delete global.ytSearchResults[searchId], 120000)

    let imgMsg = null
    try {
      imgMsg = await prepareWAMessageMedia({ image: { url: videos[0].thumbnail } }, { upload: conn.waUploadToServer })
    } catch {}

    let rows = videos.map((v, i) => ({
      title: `${i+1}. ${v.title.substring(0, 45)}`,
      description: `📺 ${v.author?.name || 'غير معروف'} | ⏱️ ${v.timestamp}`,
      id: `${usedPrefix}${command} select_${searchId}_${i}`
    }))

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: { text: `🔍 *نتائج البحث:* ${text}\n\n📋 اختر الفيديو:` },
            footer: { text: 'Hammam Bot' },
            header: { hasMediaAttachment: !!imgMsg?.imageMessage, imageMessage: imgMsg?.imageMessage || null },
            nativeFlowMessage: {
              buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({ 
                  title: "🎬 نتائج البحث", 
                  sections: [{ title: "📹 اختر الفيديو", rows }] 
                })
              }]
            }
          })
        }
      }
    }, { userJid: conn.user.jid, quoted: m })

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (error) {
    console.error('[YT]', error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
  }
}

async function showQualityMenu(m, conn, url, usedPrefix, command) {
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  let title = 'فيديو يوتيوب'
  let thumbnail = null

  try {
    const res = await fetch(`${SERVER}/info?key=${KEY}&url=${encodeURIComponent(url)}`)
    const data = await res.json()
    if (data.success) {
      title = data.title || title
      thumbnail = data.thumbnail || null
    }
  } catch {}

  let imgMsg = null
  try { 
    if (thumbnail) imgMsg = await prepareWAMessageMedia({ image: { url: thumbnail } }, { upload: conn.waUploadToServer }) 
  } catch {}

  let rows = [
    { title: "🎵 صوت MP3 128k", description: "جودة عالية - حجم صغير", id: `${usedPrefix}${command} dl_audio_128_${url}` },
    { title: "🎵 صوت MP3 320k", description: "جودة عالية جداً", id: `${usedPrefix}${command} dl_audio_320_${url}` },
    { title: "🎬 فيديو 360p", description: "جودة منخفضة - سريع", id: `${usedPrefix}${command} dl_video_360_${url}` },
    { title: "🎬 فيديو 480p", description: "جودة متوسطة", id: `${usedPrefix}${command} dl_video_480_${url}` },
    { title: "🎬 فيديو 720p", description: "جودة HD", id: `${usedPrefix}${command} dl_video_720_${url}` },
    { title: "🎬 فيديو 1080p", description: "جودة Full HD", id: `${usedPrefix}${command} dl_video_1080_${url}` }
  ]

  const msg = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body: { text: `🎬 *${title}*\n\n🎚️ *اختر نوع التحميل:*` },
          footer: { text: 'Hammam Bot' },
          header: { hasMediaAttachment: !!imgMsg?.imageMessage, imageMessage: imgMsg?.imageMessage || null },
          nativeFlowMessage: {
            buttons: [{
              name: 'single_select',
              buttonParamsJson: JSON.stringify({ 
                title: "🎬 اختر الجودة", 
                sections: [{ title: "📹 جودات التحميل", rows }] 
              })
            }]
          }
        })
      }
    }
  }, { userJid: conn.user.jid, quoted: m })

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
}

async function downloadAndSend(m, conn, url, type, quality) {
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

  try {
    const buffer = await quickDownload(url, type, quality)
    
    if (buffer.length < 1000) throw new Error('ملف صغير جداً')
    
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2)
    

    if (type === 'audio') {
      await conn.sendMessage(m.chat, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        fileName: 'youtube.mp3',
        ptt: false
      }, { quoted: m })
    } else {
      if (parseFloat(sizeMB) > 99) {
        await conn.sendMessage(m.chat, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: 'youtube.mp4',
          caption: `✅ *Hammam Bot - تم التحميل*\n📁 ${sizeMB} MB`
        }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, {
          video: buffer,
          caption: `✅ *Hammam Bot - تم التحميل*\n📁 ${sizeMB} MB`
        }, { quoted: m })
      }
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('[YT]', e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply(`❌ *"فـشـل الـتـحـمـيـل"*\n\n${e.message?.substring(0, 200)}`)
  }
}

handler.help = ['يوتيوب']
handler.tags = ['downloader']
handler.command = /^(يوتيوب|yt|youtube)$/i

export default handler