/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import { join } from 'path'
import {
    unlinkSync,
    writeFileSync,
    readFileSync,
    mkdirSync,
    readdirSync,
    rmdirSync
} from 'fs'
import { randomBytes } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import sharp from 'sharp'

const execAsync = promisify(exec)

const handler = async (m, { conn }) => {
    const quoted = m.quoted

    if (!quoted) {
        return conn.reply(
            m.chat,
            `╭─〔 ❖ Hammam 〕─╮
│ 🖼️ رد على ملصق أولاً
│
│ استخدم الأمر بالرد على
│ الملصق الذي تريد تحويله.
╰──────────────╯`,
            m
        )
    }

    const mime = quoted.mimetype || ''

    if (!mime.includes('sticker') && !mime.includes('webp')) {
        return conn.reply(
            m.chat,
            `╭─〔 ❖ Hammam 〕─╮
│ ⚠️ الملف المحدد ليس ملصقاً
│
│ يجب الرد على ملصق WebP.
╰──────────────╯`,
            m
        )
    }

    await conn.sendMessage(m.chat, {
        react: {
            text: '⏳',
            key: m.key
        }
    })

    let inputPath
    let outputPath
    let tmpDir

    try {
        const buffer = await quoted.download()

        if (!buffer) {
            throw new Error('تعذر تحميل الملصق.')
        }

        const id = randomBytes(8).toString('hex')

        tmpDir = join(process.cwd(), `nox_${id}`)
        inputPath = join(process.cwd(), `nox_${id}.webp`)
        outputPath = join(process.cwd(), `nox_${id}.mp4`)

        mkdirSync(tmpDir, { recursive: true })
        writeFileSync(inputPath, buffer)

        const image = sharp(inputPath, {
            animated: true
        })

        const metadata = await image.metadata()
        const frames = metadata.pages || 1

        if (frames > 1) {

            for (let i = 0; i < frames; i++) {
                const frame = await sharp(inputPath, {
                    page: i
                })
                    .resize(512, 512, {
                        fit: 'contain',
                        background: {
                            r: 0,
                            g: 0,
                            b: 0,
                            alpha: 1
                        }
                    })
                    .png()
                    .toBuffer()

                const frameName = `frame${String(i).padStart(4, '0')}.png`

                writeFileSync(
                    join(tmpDir, frameName),
                    frame
                )
            }

            await execAsync(
                `ffmpeg -y -r 15 -i "${tmpDir}/frame%04d.png" ` +
                `-vf "format=yuv420p" ` +
                `-c:v libx264 ` +
                `-preset ultrafast ` +
                `-crf 28 ` +
                `"${outputPath}"`
            )

        } else {

            const pngBuffer = await sharp(inputPath)
                .resize(512, 512, {
                    fit: 'contain',
                    background: {
                        r: 0,
                        g: 0,
                        b: 0,
                        alpha: 1
                    }
                })
                .png()
                .toBuffer()

            const pngPath = join(
                process.cwd(),
                `nox_${id}.png`
            )

            writeFileSync(pngPath, pngBuffer)

            await execAsync(
                `ffmpeg -y -loop 1 -i "${pngPath}" ` +
                `-vf "format=yuv420p" ` +
                `-c:v libx264 ` +
                `-preset ultrafast ` +
                `-crf 28 ` +
                `-t 3 ` +
                `"${outputPath}"`
            )

            try {
                unlinkSync(pngPath)
            } catch {}
        }

        const video = readFileSync(outputPath)

        await conn.sendMessage(
            m.chat,
            {
                video,
                mimetype: 'video/mp4',
                caption: `╭─〔 ❖ Hammam 〕─╮
│ 🎬 تم تحويل الملصق
│ إلى فيديو بنجاح.
│
│ ⚡Hammam Bot╰──────────────╯`
            },
            { quoted: m }
        )

        await conn.sendMessage(m.chat, {
            react: {
                text: '✅',
                key: m.key
            }
        })

    } catch (error) {

        console.error('[ي̶ا̶م̶ي̶ س̶و̶ك̶ه̶ي̶ر̶و̶-STICKER-VIDEO]', error)

        await conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        })

        return conn.reply(
            m.chat,
            `╭─〔 ❖ Hammam 〕─╮
│ ❌ تعذر تحويل الملصق
│
│ ${error?.message || 'حدث خطأ غير معروف'}
╰──────────────╯`,
            m
        )

    } finally {

        try {
            if (inputPath) unlinkSync(inputPath)
        } catch {}

        try {
            if (outputPath) unlinkSync(outputPath)
        } catch {}

        try {
            if (tmpDir) {
                for (const file of readdirSync(tmpDir)) {
                    try {
                        unlinkSync(join(tmpDir, file))
                    } catch {}
                }

                try {
                    rmdirSync(tmpDir)
                } catch {}
            }
        } catch {}
    }
}

handler.help = ['لفيد']
handler.tags = ['sticker']
handler.command = ['لفيد']
handler.group = false
handler.register = false

export default handler