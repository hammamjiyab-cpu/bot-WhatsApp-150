/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import axios from 'axios'
import fs from 'fs'
import { exec } from 'child_process'
import path from 'path'

const fetchStickerVideo = async (text) => {
  try {
    const res = await axios.get(
      'https://skyzxu-brat.hf.space/brat-animated',
      {
        params: { text },
        responseType: 'arraybuffer',
        timeout: 20000
      }
    )

    if (!res.data) throw new Error('لم يتم استلام أي بيانات من الـ API.')
    return res.data

  } catch (err) {
    throw new Error('حدث خطأ أثناء جلب الفيديو.')
  }
}

const convertToWebp = (input, output) => {
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -loop 0 -an -vsync 0 "${output}"`,
      (err) => {
        if (err) reject(new Error('حدث خطأ أثناء تحويل الفيديو إلى WebP'))
        else resolve()
      }
    )
  })
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
  let mp4, webp

  try {
    text = m.quoted?.text || text
    if (!text) {
      return conn.reply(
        m.chat,
        '《✧》 يجب عليك الرد على رسالة أو كتابة نص.',
        m
      )
    }

    await m.react('🕒')

    let user = globalThis.db.data.users[m.sender] || {}
    let name = user.name || m.sender.split('@')[0]

    let packname = user.metadatos || 'Sʜᴀᴅᴏᴡ Gᴀʀᴅᴇɴ ⚜'
    let author = user.metadatos2 || `@${name}`

    const buffer = await fetchStickerVideo(text)

    const id = Date.now()
    mp4 = path.resolve(`./tmp-${id}.mp4`)
    webp = path.resolve(`./tmp-${id}.webp`)

    fs.writeFileSync(mp4, buffer)

    await convertToWebp(mp4, webp)

    await conn.sendMessage(
      m.chat,
      {
        sticker: fs.readFileSync(webp),
        packname,
        author
      },
      { quoted: m }
    )

    await m.react('✔️')

  } catch (e) {
    await m.react('✖️')

    conn.reply(
      m.chat,
      `⚠︎ حدث خطأ أثناء تنفيذ *${usedPrefix + command}*\n\n${e.message}`,
      m
    )

  } finally {
    
    try { if (mp4 && fs.existsSync(mp4)) fs.unlinkSync(mp4) } catch {}
    try { if (webp && fs.existsSync(webp)) fs.unlinkSync(webp) } catch {}
  }
}

handler.help = ['براتفيد']
handler.tags = ['sticker']
handler.command = ['براتفيد']

export default handler