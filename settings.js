// settings.js — central configuration / الإعدادات المركزية
// Change values in the .env file (recommended) or directly here. Nothing else needs editing.
import fs from 'fs'
import { CHANNEL_LINK, CHANNEL_JID } from './core/credits.js'

try { if (fs.existsSync('.env')) process.loadEnvFile('.env') } catch {}
const env = (k, d = '') => String(process.env[k] ?? d).trim()
const digits = s => String(s || '').replace(/\D/g, '')

// ==================== 1) Developer / المطور ====================
// Your WhatsApp number: country code + number, digits only (no + and no spaces).
// Example: 9677XXXXXXXX      ← set DEV_NUMBER in .env
global.DEV_NAME = env('DEV_NAME', 'Hammam')
global.DEV_NUMBER = digits(env('DEV_NUMBER'))
global.owner = global.DEV_NUMBER ? [global.DEV_NUMBER] : []
global.mods = []
global.prems = []

// ==================== 2) Bot identity / هوية البوت ====================
global.botName = env('BOT_NAME', 'Hammam Bot')
global.botNameShort = env('BOT_SHORT_NAME', 'Hammam')
global.botname = global.botName
global.watermark = global.botName
global.packname = global.botName
global.author = global.DEV_NAME
global.dev = global.DEV_NAME

// The number the bot will run on (can be the same as DEV_NUMBER). Set BOT_NUMBER in .env.
// Leave empty to be asked for it in the terminal on first run.
global.botNumberCode = digits(env('BOT_NUMBER'))

// ==================== 3) Language / اللغة ====================
// One line to change every bot reply: ar | en | fr | es | tr | de | ru | id | hi | ur ...
global.LANG = env('BOT_LANG', 'ar')

// ==================== 4) Channel (official, from core/credits.js) ====================
global.CHANNEL_LINK = CHANNEL_LINK
global.ch = { ch1: CHANNEL_JID, ch2: '' }

// ==================== 5) Links ====================
global.yt = env('LINK_YOUTUBE', 'https://youtube.com')
global.ig = env('LINK_INSTAGRAM', 'https://instagram.com')
global.tk = env('LINK_TIKTOK', 'https://tiktok.com')
global.fb = env('LINK_FACEBOOK', 'https://facebook.com')
global.paypal = env('LINK_PAYPAL', 'https://paypal.me')
global.md = global.CHANNEL_LINK
global.soporteGB = global.CHANNEL_LINK

// ==================== 6) Optional API keys (put them in .env) ====================
global.APIs = { groq: env('GROQ_API_KEY') }

// ==================== 7) General ====================
global.multiplier = 85
global.currency = 'كوين'
global.support = { ffmpeg: true }
global.rcanal = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: { newsletterJid: CHANNEL_JID, newsletterName: global.botName, serverMessageId: -1 }
  }
}

// ==================== 8) Permission messages ====================
global.dfailMessages = {
  rowner: '❌ *المطور فقط*',
  owner: '❌ *المطور فقط*',
  mods: '❌ *القادة فقط*',
  premium: '⭐ *بريميوم فقط*',
  group: '👥 *جروبات فقط*',
  private: '📱 *خاص فقط*',
  admin: '👑 *مشرفين فقط*',
  botAdmin: '🤖 *البوت مش أدمن*',
  unreg: '📝 *غير مسجل*',
  restrict: '🚫 *معطل حالياً*'
}
global.dfailTitle = global.botName
global.dfailDesc = global.botName
global.dfailUrl = global.CHANNEL_LINK
global.dfailPool = [] // images for permission messages (empty = plain text)

// Options read by the engine and plugins
global.opts = global.opts || {
  restrict: true,
  noprint: true,
  autoread: false
}
