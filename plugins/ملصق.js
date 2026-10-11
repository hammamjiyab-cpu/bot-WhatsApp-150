// plugins/sticker.js
// Hammam Bot- Sticker Maker 🎨

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import sharp from 'sharp'
import webp from 'node-webpmux'
import crypto from 'crypto'

const execAsync = promisify(exec)

// ⚡ جلب FPS الفيديو
async function getVideoFPS(inputPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
      { timeout: 10000 }
    )
    let fps = stdout.trim()
    if (fps.includes('/')) {
      let [num, den] = fps.split('/').map(Number)
      fps = Math.round(num / den)
    }
    return Math.min(Math.max(parseInt(fps) || 15, 8), 30)
  } catch {
    return 15
  }
}

// ⚡ جلب مدة الفيديو
async function getVideoDuration(inputPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
      { timeout: 10000 }
    )
    return parseFloat(stdout.trim()) || 7
  } catch {
    return 7
  }
}

// ⚡ إضافة Metadata للملصق
async function addStickerMetadata(webpBuffer, packName = 'Hammam Bot', authorName = '⚔️ Hammam Bot') {
  try {
    const img = new webp.Image()
    await img.load(webpBuffer)

    const json = {
      'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
      'sticker-pack-name': packName,
      'sticker-pack-publisher': authorName,
      'emojis': ['⚔️', '⚡']
    }

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ])

    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
    const exif = Buffer.concat([exifAttr, jsonBuffer])
    exif.writeUIntLE(jsonBuffer.length, 14, 4)
    img.exif = exif

    return await img.save(null)
  } catch {
    return webpBuffer
  }
}

let handler = async (m, { conn }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (!mime || (!mime.includes('image') && !mime.includes('video'))) {
        return m.reply('⚔️ *"الرجاء الرد على صورة أو فيديو"*')
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    try {
        let media = await q.download()

        // ⚡ لو صورة
        if (mime.includes('image')) {
            let webp = await sharp(media)
                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 90, lossless: false })
                .toBuffer()

            webp = await addStickerMetadata(webp, 'Hammam Bot', '⚔️ Hammam Bot')

            await conn.sendMessage(m.chat, { sticker: webp }, { quoted: m })
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
            return
        }

        // ⚡ لو فيديو - نفس فريمات الفيديو الأصلي
        if (mime.includes('video')) {
            let inputPath = join(tmpdir(), `sticker_in_${Date.now()}.mp4`)
            let outputPath = join(tmpdir(), `sticker_out_${Date.now()}.webp`)

            writeFileSync(inputPath, media)

            let originalFPS = await getVideoFPS(inputPath)
            let duration = await getVideoDuration(inputPath)
            let maxDuration = Math.min(duration, 7)

            let cmd = `ffmpeg -i "${inputPath}" -vf "fps=${originalFPS},scale=512:512:flags=lanczos" -c:v libwebp -lossless 0 -compression_level 4 -q:v 50 -loop 0 -preset default -an -t ${maxDuration} "${outputPath}" -y`

            await execAsync(cmd, { timeout: 60000 })

            if (!existsSync(outputPath)) throw new Error('فشل التحويل')

            let stickerBuffer = readFileSync(outputPath)

            // لو الحجم كبير
            if (stickerBuffer.length > 1024 * 1024) {
                let smallerPath = join(tmpdir(), `sticker_small_${Date.now()}.webp`)
                let cmd2 = `ffmpeg -i "${inputPath}" -vf "fps=${Math.min(originalFPS, 10)},scale=256:256:flags=lanczos" -c:v libwebp -lossless 0 -compression_level 6 -q:v 70 -loop 0 -preset default -an -t ${maxDuration} "${smallerPath}" -y`
                await execAsync(cmd2, { timeout: 60000 })
                
                if (existsSync(smallerPath)) {
                    stickerBuffer = readFileSync(smallerPath)
                    try { unlinkSync(smallerPath) } catch {}
                }
            }

            stickerBuffer = await addStickerMetadata(stickerBuffer, 'Hammam Bot', '⚔️ Hammam Bot')

            await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

            try { unlinkSync(inputPath) } catch {}
            try { unlinkSync(outputPath) } catch {}
        }

    } catch (e) {
        console.error('[Sticker] Error:', e)
        await m.reply('❌ *"فشل التحويل"*\n⚡ جرب فيديو أقصر')
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    }
}

handler.command = ['ستيكر', 'sticker', 'ملصق']
handler.help = ['ستيكر']
handler.tags = ['sticker']

export default handler