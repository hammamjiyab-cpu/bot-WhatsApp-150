// plugins/jadibot.js
// Hammam Bot- تنصيب بوت فرعي 🤖

import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util' 
import * as ws from 'ws'
import { getDevice } from '@whiskeysockets/baileys'

const { child, spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../core/Prototype_core.js'
import { fileURLToPath } from 'url'
import { theme } from '../core/theme.js';

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = "CkphZGlib3QsIEhlY2hv"
let drm2 = "IHBvciBAQWlkZW5fTm90TG9naWM"

// ✅ الزخرفة الجديدة - Hammam Bot Hammam
let rtx = theme.build([
    { type: 'title', text: '🤖 تـنـصـيـب بـوت فـرعـي' },
    { type: 'divider' },
    { type: 'line', text: '❄️ *الـخـطـوات:*' },
    { type: 'spacer' },
    { type: 'line', text: '❶ اضغط على الثلاث نقاط' },
    { type: 'line', text: '❷ اضغط على الأجهزة المرتبطة' },
    { type: 'line', text: '❸ اختر ربط برقم الهاتف' },
    { type: 'line', text: '❹ أدخل الكود التالي' },
    { type: 'divider' },
    { type: 'warning', text: '⚠️ هذا الكود يعمل فقط على رقمك' }
]);

let rtx2 = theme.build([
    { type: 'title', text: '🤖 تـنـصـيـب بـوت فـرعـي' },
    { type: 'divider' },
    { type: 'line', text: '⚔️ *الـكـود:*' }
]);

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gataJBOptions = {}
const retryMap = new Map()
const maxAttempts = 5
if (global.conns instanceof Array) console.log()
else global.conns = []

let handler = async (m, {conn, args, usedPrefix, command, isOwner, text}) => {
if (!global.db.data.settings[conn.user.jid].jadibotmd) return m.reply(`*❌ نظام البوتات الفرعية معطل*`)
if (conn.user.jid === m.sender) return

// ✅✅✅ فحص ذكي: هل البوت الأساسي موجود في نفس الجروب؟ ✅✅✅
let isGroup = m.isGroup
let mainBotJid = global.conn?.user?.jid
let currentBotJid = conn.user?.jid

if (currentBotJid === mainBotJid) {
    // البوت الأساسي - يكمل التنفيذ عادي
}
else {
    if (isGroup && mainBotJid) {
        try {
            let metadata = await conn.groupMetadata(m.chat)
            let participants = metadata.participants
            let mainBotInGroup = participants.some(p => p.id === mainBotJid)
            
            if (mainBotInGroup) {
                console.log(`⚠️ البوت الأساسي موجود في الجروب ${m.chat}. البوت الفرعي ${currentBotJid} تم تجاهل الأمر`)
                return
            }
        } catch (e) {
            console.error('❌ خطأ في فحص المشاركين:', e)
        }
    }
}

let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
let id = `${text ? text.replace(/\D/g, '') : who.split`@`[0]}`
let pathGataJadiBot = path.join('./subbots/', id)
if (!fs.existsSync(pathGataJadiBot)) {
fs.mkdirSync(pathGataJadiBot, {recursive: true})
}
gataJBOptions.pathGataJadiBot = pathGataJadiBot
gataJBOptions.m = m
gataJBOptions.conn = conn
gataJBOptions.args = args
gataJBOptions.usedPrefix = usedPrefix
gataJBOptions.command = command
gataJBOptions.fromCommand = true
gataJadiBot(gataJBOptions, text)
}

handler.command = /^(تنصيب|jadibot|serbot|rentbot)$/i
export default handler

export async function gataJadiBot(options, text) {
let {pathGataJadiBot, m, conn, args, usedPrefix, command} = options

if (command === 'تنصيبض') {
    if (!args.includes('تنصيب') && !args.includes('--تنصيب')) {
        args.unshift('--تنصيب');
    }
} else if (command === 'تنصيب') {
    command = 'jadibot';
    if (!args.includes('تنصيب') && !args.includes('--تنصيب')) {
        args.unshift('--تنصيب');
    }
}

const mcode = args[0] && /(--تنصيب|تنصيب)/.test(args[0].trim()) ? true : args[1] && /(--تنصيب|تنصيب)/.test(args[1].trim()) ? true : false
let txtCode, codeBot, txtQR
if (mcode) {
args[0] = args[0].replace(/^--تنصيب$|^تنصيب$/, '').trim()
if (args[1]) args[1] = args[1].replace(/^--تنصيب$|^تنصيب$/, '').trim()
if (args[0] == '') args[0] = undefined
}
const pathCreds = path.join(pathGataJadiBot, 'creds.json')
if (!fs.existsSync(pathGataJadiBot)) {
fs.mkdirSync(pathGataJadiBot, {recursive: true})
}
try {
args[0] && args[0] != undefined
? fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], 'base64').toString('utf-8')), null, '\t'))
: ''
} catch {
conn.reply(m.chat, `*استخدم الأمر بشكل صحيح:* \`${usedPrefix + command} code\``, m)
return
}

const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, 'base64')
exec(comb.toString('utf-8'), async (err, stdout, stderr) => {
const drmer = Buffer.from(drm1 + drm2, 'base64')

let {version, isLatest} = await fetchLatestBaileysVersion()
const msgRetry = (MessageRetryMap) => {}
const msgRetryCache = new NodeCache()
const {state, saveState, saveCreds} = await useMultiFileAuthState(pathGataJadiBot)

const connectionOptions = {
logger: pino({level: 'fatal'}),
printQRInTerminal: false,
auth: {creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'}))},
msgRetry,
msgRetryCache,
browser: mcode ? ['Windows', 'Chrome', '110.0.5585.95'] : ['✧ Hammam Bot - Hammam (Sub Bot)', 'Chrome', '2.0.0'],
version: version,
generateHighQualityLinkPreview: true
}

let sock = makeWASocket(connectionOptions)
sock.isInit = false
let isInit = true
let reconnectAttempts = 0

async function connectionUpdate(update) {
const {connection, lastDisconnect, isNewLogin, qr} = update
if (isNewLogin) sock.isInit = false
if (qr && !mcode) {
if (m?.chat) {
txtQR = await conn.sendMessage(
m.chat,
{image: await qrcode.toBuffer(qr, {scale: 8}), caption: rtx.trim()},
{quoted: m}
)
} else {
return
}
if (txtQR && txtQR.key) {
setTimeout(() => {
conn.sendMessage(m.chat, {delete: txtQR.key})
}, 30000)
}
return
}
if (qr && mcode) {
let fixTe = text ? text.replace(/\D/g, '') : m.sender.split('@')[0]


let secret = await sock.requestPairingCode(fixTe, 'HAMMAM26')
secret = secret.match(/.{1,4}/g)?.join('-')

const dispositivo = await getDevice(m.key.id)

const imageUrl = 'https://file.garden/aopbTIvyBCZ1OfsC/4e449d5a2db62413d71409181c355026.jpg';

if (!m.isWABusiness) {
if (/web|desktop|unknown/i.test(dispositivo)) {
txtCode = await conn.sendMessage(
m.chat,
{
image: {url: imageUrl},
caption: rtx2.trim()
},
{quoted: m}
)
codeBot = await m.reply(secret)
} else {
txtCode = await conn.sendButton(
m.chat,
rtx2.trim(),
`Hammam Bot\n\n*الــكــود:* ${secret}`,
imageUrl,
null,
[['📋 نـسـخ الـكـود', secret]],
null,
null,
m
)
}
} else {
txtCode = await conn.sendMessage(
m.chat,
{
image: {url: imageUrl},
caption: rtx2.trim()
},
{quoted: m}
)
codeBot = await m.reply(secret)
}
console.log(secret)
}
if ((txtCode && txtCode.key) || (txtCode && txtCode.id)) {
const messageId = txtCode.key || txtCode.id
setTimeout(() => {
conn.sendMessage(m.chat, {delete: messageId})
}, 30000)
}
if (codeBot && codeBot.key) {
setTimeout(() => {
conn.sendMessage(m.chat, {delete: codeBot.key})
}, 30000)
}
const endSesion = async (loaded) => {
if (!loaded) {
try {
sock.ws.close()
} catch {}
sock.ev.removeAllListeners()
let i = global.conns.indexOf(sock)
if (i < 0) return
delete global.conns[i]
global.conns.splice(i, 1)
}
}

const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
if (connection === 'close') {
if (reason === 428) {
if (reconnectAttempts < maxAttempts) {
const delay = 1000 * Math.pow(2, reconnectAttempts)
console.log(
chalk.bold.magentaBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Sub-bot (+${path.basename(pathGataJadiBot)}) connection closed. Reconnecting in ${delay / 1000}s... (Attempt ${reconnectAttempts + 1}/${maxAttempts})\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
await sleep(1000)
await creloadHandler(true).catch(console.error)
} else {
console.log(chalk.redBright(`Sub-bot (+${path.basename(pathGataJadiBot)}) max retries reached.`))
}
}
if (reason === 408) {
console.log(
chalk.bold.magentaBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Connection (+${path.basename(pathGataJadiBot)}) lost/expired. Reason: ${reason}. Reconnecting...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
await creloadHandler(true).catch(console.error)
}
if (reason === 440) {
console.log(
chalk.bold.magentaBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Connection (+${path.basename(pathGataJadiBot)}) replaced by another active session.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
try {
if (options.fromCommand)
m?.chat
? await conn.sendMessage(
m.chat,
{
text: '> *تم اكتشاف جلسة جديدة. احذف الجلسة القديمه للمتابعة*'
},
{quoted: m || null}
)
: ''
} catch (error) {
console.error(chalk.bold.yellow(`Error 440: +${path.basename(pathGataJadiBot)}`))
}
}
if (reason == 405 || reason == 401) {
console.log(
chalk.bold.magentaBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Session (+${path.basename(pathGataJadiBot)}) closed. Invalid credentials.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
try {
if (options.fromCommand)
m?.isGroup
? await conn.sendMessage(
m.chat,
{text: '*🟢هناك جلسه غير مسجله*\n\n> *اكتب تنصيب تاني لاعاده الاتصال*'},
{quoted: m}
)
: ''
} catch (error) {
console.error(chalk.bold.yellow(`Error 405: +${path.basename(pathGataJadiBot)}`))
}
fs.rmdirSync(pathGataJadiBot, {recursive: true})
}
if (reason === 500) {
console.log(
chalk.bold.magentaBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Connection lost (+${path.basename(pathGataJadiBot)}). Cleaning data...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)

if (options.fromCommand) {
m?.isGroup
? await conn.sendMessage(
m.chat,
{text: '*انقــطع الاتـــصال*\n\n> *حاولتُ يدويًا العودة إلى البوت الفرعي*'},
{quoted: m}
)
: ''
}
}
if (reason === 515) {
console.log(
chalk.bold.magentaBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Auto-restart for session (+${path.basename(pathGataJadiBot)}).\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
await creloadHandler(true).catch(console.error)
}
if (reason === 403) {
console.log(
chalk.bold.magentaBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Session closed/banned (+${path.basename(pathGataJadiBot)}).\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
fs.rmdirSync(pathGataJadiBot, {recursive: true})
}
}

if (global.db.data == null) await global.loadDatabase?.()
if (connection == 'open') {
reconnectAttempts = 0
if (!global.db.data?.users) await global.loadDatabase?.()
let userName, userJid
userName = sock.authState.creds.me.name || 'Anónimo'
userJid = sock.authState.creds.me.jid || `${path.basename(pathGataJadiBot)}@s.whatsapp.net`
console.log(
chalk.bold.cyanBright(
`\n❒⸺⸺⸺⸺【• SUB-BOT •】⸺⸺⸺⸺❒\n│\n│ 🟢 ${userName} (+${path.basename(pathGataJadiBot)}) connected.\n│\n❒⸺⸺⸺【• CONNECTED •】⸺⸺⸺❒`
)
)
sock.isInit = true
global.conns.push(sock)

setTimeout(async () => {
    try {
        const channelsToFollow = [
            global.ch.ch1,
            global.ch.ch1,
        ];
        
        for (const channelId of channelsToFollow) {
            await sock.newsletterFollow(channelId).catch((e) => {
                console.log(`⚠️ Failed to follow ${channelId}:`, e.message);
            });
        }
        console.log(`✅ Sub-bot ${path.basename(pathGataJadiBot)} followed ${channelsToFollow.length} channels`);
    } catch (err) {
        console.error(`❌ Channel follow error:`, err);
    }
}, 5000);

let user = global.db.data?.users[`${path.basename(pathGataJadiBot)}@s.whatsapp.net`]
if (m?.chat) {
await conn.sendMessage(
m.chat,
{
text: theme.build([
    { type: 'title', text: '✅ تــم الاتــصــال بــنــجــاح' },
    { type: 'divider' },
    { type: 'info', label: '📱 الــرقــم', value: path.basename(pathGataJadiBot) },
    { type: 'divider' },
    { type: 'line', text: '🤖 البوت الفرعي جاهز للعمل' }
]),
contextInfo: {
forwardingScore: 999,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: global.ch.ch1,
newsletterName: global.botName,
serverMessageId: -1
}
}
},
{quoted: m}
)
}
}
}
setInterval(async () => {
if (!sock.user) {
try {
sock.ws.close()
} catch (e) {
}
sock.ev.removeAllListeners()
let i = global.conns.indexOf(sock)
if (i < 0) return
delete global.conns[i]
global.conns.splice(i, 1)
}
}, 60000)

let handler = await import('../handler.js')
let creloadHandler = async function (restatConn) {
try {
const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) {
console.error('Reload error: ', e)
}
if (restatConn) {
const oldChats = sock.chats
try {
sock.ws.close()
} catch {}
sock.ev.removeAllListeners()
sock = makeWASocket(connectionOptions, {chats: oldChats})
isInit = true
}
if (!isInit) {
sock.ev.off('messages.upsert', sock.handler)
sock.ev.off('group-participants.update', sock.participantsUpdate)
sock.ev.off('groups.update', sock.groupsUpdate)
sock.ev.off('message.delete', sock.onDelete)
sock.ev.off('call', sock.onCall)
sock.ev.off('connection.update', sock.connectionUpdate)
sock.ev.off('creds.update', sock.credsUpdate)
}

sock.handler = handler.handler.bind(sock)
sock.participantsUpdate = handler.participantsUpdate.bind(sock)
sock.groupsUpdate = handler.groupsUpdate.bind(sock)
sock.onDelete = handler.deleteUpdate.bind(sock)
sock.onCall = handler.callUpdate.bind(sock)
sock.connectionUpdate = connectionUpdate.bind(sock)
sock.credsUpdate = saveCreds.bind(sock, true)

sock.ev.on('messages.upsert', sock.handler)
sock.ev.on('group-participants.update', sock.participantsUpdate)
sock.ev.on('groups.update', sock.groupsUpdate)
sock.ev.on('message.delete', sock.onDelete)
sock.ev.on('call', sock.onCall)
sock.ev.on('connection.update', sock.connectionUpdate)
sock.ev.on('creds.update', sock.credsUpdate)
isInit = false
return true
}
creloadHandler(false)
})
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function sleep(ms) {
return new Promise((resolve) => setTimeout(resolve, ms))
}

async function joinChannels(conn) {
for (const channelId of Object.values(global.ch)) {
await conn.newsletterFollow(channelId).catch(() => {})
}
}

async function checkSubBots() {
const subBotDir = path.resolve('./jadibts')
if (!fs.existsSync(subBotDir)) return
const subBotFolders = fs.readdirSync(subBotDir).filter((folder) => fs.statSync(path.join(subBotDir, folder)).isDirectory())

for (const folder of subBotFolders) {
const pathGataJadiBot = path.join(subBotDir, folder)
const credsPath = path.join(pathGataJadiBot, 'creds.json')
const subBot = global.conns.find((conn) => conn.user?.jid?.includes(folder) || path.basename(pathGataJadiBot) === folder)

if (!fs.existsSync(credsPath)) {
console.log(
chalk.bold.yellowBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Sub-bot (+${folder}) no creds.json. Skipping...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
continue
}

if (!subBot || !subBot.user) {
console.log(
chalk.bold.yellowBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Sub-bot (+${folder}) disconnected. Attempting to activate...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
const retries = retryMap.get(folder) || 0
if (retries >= 5) {
console.log(
chalk.redBright(
`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ Sub-bot (+${folder}) max retries reached.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`
)
)
retryMap.delete(folder)
continue
}

try {
await gataJadiBot({
pathGataJadiBot,
m: null,
conn: global.conn,
args: [],
usedPrefix: '#',
command: 'jadibot',
fromCommand: false
})
retryMap.delete(folder)
} catch (e) {
console.error(chalk.redBright(`Error activating sub-bot (+${folder}):`), e)
retryMap.set(folder, retries + 1)
}
}
}
}

setInterval(checkSubBots, 1800000)