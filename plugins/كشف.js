// plugins/viewonce.js
// Hammam Bot— كشف ViewOnce 👁️

import {
    downloadContentFromMessage,
    downloadMediaMessage,
    proto,
} from '@whiskeysockets/baileys'
import { theme } from '../core/theme.js'

const VO_WRAPPERS = [
    'viewOnceMessageV2Extension',
    'viewOnceMessageV2',
    'viewOnceMessage',
]

function detectViewOnce(m) {
    const rawQuoted = m.msg?.contextInfo?.quotedMessage || {}

    if (VO_WRAPPERS.includes(m.quoted?.mtype)) {
        return { raw: rawQuoted, wrapper: m.quoted.mtype }
    }

    for (const w of VO_WRAPPERS) {
        if (rawQuoted[w]) return { raw: rawQuoted, wrapper: w }
    }

    for (const w of VO_WRAPPERS) {
        if (rawQuoted?.ephemeralMessage?.message?.[w]) {
            return { raw: rawQuoted.ephemeralMessage.message, wrapper: w }
        }
    }

    const quotedMsg = m.quoted
    if (quotedMsg) {
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage']
        for (const mt of mediaTypes) {
            const obj = quotedMsg[mt] || rawQuoted?.[mt]
            if (obj?.viewOnce === true) {
                return {
                    raw: { [mt]: obj },
                    wrapper: null,
                    directMedia: { type: mt.replace('Message', ''), key: mt, obj }
                }
            }
        }
    }

    const innerMsg = m.quoted?.message || {}
    for (const mt of ['imageMessage', 'videoMessage', 'audioMessage']) {
        if (innerMsg[mt]?.viewOnce) {
            return {
                raw: innerMsg,
                wrapper: null,
                directMedia: { type: mt.replace('Message', ''), key: mt, obj: innerMsg[mt] }
            }
        }
    }

    return null
}

function extractMedia(detection) {
    if (detection.directMedia) return detection.directMedia

    const { raw, wrapper } = detection
    let innerMsg = wrapper ? (raw[wrapper]?.message || {}) : raw

    if (innerMsg.ephemeralMessage?.message) {
        innerMsg = innerMsg.ephemeralMessage.message
    }

    const mediaTypes = [
        { key: 'imageMessage', type: 'image' },
        { key: 'videoMessage', type: 'video' },
        { key: 'audioMessage', type: 'audio' },
    ]

    for (const { key, type } of mediaTypes) {
        if (innerMsg[key]) {
            const obj = { ...innerMsg[key] }
            delete obj.viewOnce
            return { type, key, obj }
        }
    }
    return null
}

async function M1_stream(media) {
    if (!media.obj?.url && !media.obj?.directPath) throw new Error('مفيش url')
    const stream = await downloadContentFromMessage(media.obj, media.type)
    const chunks = []
    for await (const c of stream) chunks.push(c)
    const buf = Buffer.concat(chunks)
    if (buf?.length > 100) return buf
    throw new Error('buffer فاضي')
}

async function M2_simpleDownload(m) {
    const buf = await m.quoted.download()
    if (buf?.length > 100) return buf
    throw new Error('buffer فاضي')
}

async function M3_downloadM(conn, media) {
    if (!conn.downloadM) throw new Error('conn.downloadM غير موجود')
    const buf = await conn.downloadM(media.obj, media.type)
    if (buf?.length > 100) return buf
    throw new Error('buffer فاضي')
}

async function M4_fakeWM(conn, m, media) {
    const vM = m.quoted?.vM || m.quoted?.fakeObj
    if (!vM) throw new Error('مفيش vM')
    const fakeWM = proto.WebMessageInfo.fromObject({
        key: vM.key,
        message: { [media.key]: media.obj },
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
    })
    const buf = await downloadMediaMessage(fakeWM, 'buffer', {}, {
        logger: { info:()=>{}, error:()=>{}, warn:()=>{}, debug:()=>{} },
        reuploadRequest: conn.updateMediaMessage?.bind(conn),
    })
    if (buf?.length > 100) return buf
    throw new Error('buffer فاضي')
}

async function M5_rawVM(conn, m) {
    const vM = m.quoted?.vM || m.quoted?.fakeObj
    if (!vM) throw new Error('مفيش vM')
    const buf = await downloadMediaMessage(vM, 'buffer', {}, {
        logger: { info:()=>{}, error:()=>{}, warn:()=>{}, debug:()=>{} },
        reuploadRequest: conn.updateMediaMessage?.bind(conn),
    })
    if (buf?.length > 100) return buf
    throw new Error('buffer فاضي')
}

async function M6_reupload(conn, m, media) {
    if (!conn.updateMediaMessage) throw new Error('updateMediaMessage مش موجود')
    const vM = m.quoted?.vM || m.quoted?.fakeObj
    if (!vM) throw new Error('مفيش vM')
    const fakeWM = proto.WebMessageInfo.fromObject({
        key: vM.key,
        message: { [media.key]: media.obj },
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
    })
    const updated = await conn.updateMediaMessage(fakeWM)
    const buf = await downloadMediaMessage(updated, 'buffer', {}, {
        logger: { info:()=>{}, error:()=>{}, warn:()=>{}, debug:()=>{} }
    })
    if (buf?.length > 100) return buf
    throw new Error('buffer فاضي بعد reupload')
}

async function M7_forward(conn, m) {
    const vM = m.quoted?.vM || m.quoted?.fakeObj
    if (!vM) throw new Error('مفيش vM')
    await conn.copyNForward(m.chat, vM, true, { readViewOnce: true })
    return 'forwarded'
}

async function M8_directForward(conn, m) {
    const vM = m.quoted?.vM || m.quoted?.fakeObj
    if (!vM) throw new Error('مفيش vM')
    await conn.sendMessage(m.chat, { forward: vM, force: true }, {})
    return 'forwarded'
}

let handler = async (m, { conn }) => {

    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }) } catch {}
    }

    if (!m.quoted) {
        await react('❌')
        return m.reply(theme.build([{ type: 'title', text: `وحدة كشف ViewOnce` }, { type: 'divider' }, { type: 'line', text: `👁️ رد على رسالة ViewOnce 🔒 أولاً` }]))
    }

    const detection = detectViewOnce(m)

    if (!detection) {
        await react('❌')
        return m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `👁️ هذه ليست رسالة ViewOnce` }, { type: 'line', text: `🔒 رد على رسالة فيها 🔒` }]))
    }

    await react('⏳')

    const media = extractMedia(detection)

    if (!media) {
        await react('❌')
        return m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `👁️ لا يمكن الوصول للميديا` }]))
    }

    const errors = []
    let buf = null

    const methods = [
        ['M1 stream',        () => M1_stream(media)],
        ['M2 simpleDownload',() => M2_simpleDownload(m)],
        ['M3 downloadM',     () => M3_downloadM(conn, media)],
        ['M4 fakeWM',        () => M4_fakeWM(conn, m, media)],
        ['M5 rawVM',         () => M5_rawVM(conn, m)],
        ['M6 reupload',      () => M6_reupload(conn, m, media)],
        ['M7 copyNForward',  () => M7_forward(conn, m)],
        ['M8 directForward', () => M8_directForward(conn, m)],
    ]

    for (const [name, fn] of methods) {
        try {
            const res = await fn()
            if (res === 'forwarded') { await react('✅'); return }
            buf = res
            break
        } catch (e) { errors.push(`${name}: ${e.message}`) }
    }

    if (!buf) {
        await react('❌')
        return m.reply(`> ❄️ *"فشل الكشف"*\n> \n> 👁️ فشلت كل الطرق\n> \n> 🔮 *الأخطاء:*\n${errors.map(e => `> • ${e}`).join('\n')}`)
    }

    try {
        const cap = theme.build([{ type: 'title', text: `🔓 تم الكشف!` }])
        
        if (media.type === 'image') {
            await conn.sendMessage(m.chat, { image: buf, caption: cap }, { quoted: m })
        } else if (media.type === 'video') {
            await conn.sendMessage(m.chat, { video: buf, caption: cap }, { quoted: m })
        } else if (media.type === 'audio') {
            await conn.sendMessage(m.chat, {
                audio: buf, 
                mimetype: 'audio/ogg; codecs=opus', 
                ptt: true
            }, { quoted: m })
        }
        await react('✅')
    } catch (e) {
        await react('❌')
        m.reply(theme.build([{ type: 'title', text: `فشل الإرسال` }, { type: 'divider' }, { type: 'error', text: `👁️ ${e.message}` }]))
    }
}

handler.help    = ['كشف']
handler.tags    = ['tools']
handler.command = /^(كشف|فضح|vv|viewonce|vo)$/i

export default handler