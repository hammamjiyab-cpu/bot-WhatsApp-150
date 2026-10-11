import './settings.js'
import './firebase.js'
import readline from 'readline/promises'
import { CHANNEL_JID, CREDIT_LINE } from './core/credits.js'
import './core/db.js'
import { loadPlugins } from './core/plugins-loader.js'
import { loadPlugins2 } from './core/plugins2-loader.js'
import { startHotReload } from './core/hot-reload.js'
import { startPanel, syncOwners } from './core/panel.js'
import { restore as loadSubs } from './core/subbots.js'
import { makeWASocket, protoType, serialize } from './core/Prototype_core.js'
import {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} from '@whiskeysockets/baileys'

import pino from 'pino'
import fs from 'fs'

import {
  handler,
  participantsUpdate,
  groupsUpdate,
  callUpdate,
  deleteUpdate,
  joinRequestUpdate
} from './handler.js'

// First run: ask for the WhatsApp number to link (when BOT_NUMBER is not set)
async function askPhoneNumber() {
  if (!process.stdin.isTTY) {
    console.log('ℹ️ No number set. Put BOT_NUMBER in .env (digits only) and restart, or link from the panel.')
    return ''
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log('')
  const answer = await rl.question('📱 Enter the WhatsApp number to link (digits only, with country code, e.g. 9677XXXXXXXX): ')
  rl.close()
  return String(answer || '').replace(/\D/g, '')
}

// ضروري لهيندر الأوامر: يضيف m.text و m.sender و m.reply و m.isAdmin ... على رسائل واتساب
protoType()
serialize()

const AUTH_FOLDER = './session'

async function startBot() {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('        🇾🇪 Hammam Bot')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true })
  }

  // تحميل البلوقنات مرة وحدة (إعادة الاتصال ما تعيد التحميل)
  await loadPlugins()
  await loadPlugins2()
  startHotReload()
  startPanel()
  setTimeout(() => loadSubs().catch(e => console.log('⚠️ البوتات الفرعية:', e.message)), 15000)

  const { state, saveCreds } =
    await useMultiFileAuthState(AUTH_FOLDER)

  const { version } =
    await fetchLatestBaileysVersion()

  let phoneNumber =
    String(global.botNumberCode || '').replace(/\D/g, '')

  if (!phoneNumber && !state.creds.registered) {
    phoneNumber = await askPhoneNumber()
  }

  console.log(`📱 رقم البوت: ${phoneNumber}`)
  console.log(`📁 الجلسة: ${AUTH_FOLDER}`)

  const conn = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: Browsers.windows('Chrome'),
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000
  })

  global.conn = conn
  global.panelLink = { state } // اللوحة تعرف منه هل الجلسة مربوطة

  conn.ev.on('creds.update', saveCreds)

  if (!state.creds.registered && phoneNumber) {
    try {
      console.log('')
      console.log('⏳ جاري تجهيز كود الربط...')
      console.log('')

      await new Promise(resolve =>
        setTimeout(resolve, 5000)
      )

      let code =
        await conn.requestPairingCode(
          phoneNumber,
          'ABCD1234'
        )

      code =
        code?.match(/.{1,4}/g)?.join('-') || code

      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('        🔑 كود ربط واتساب')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      console.log(`        ${code}`)
      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      console.log('📱 واتساب:')
      console.log('⚙️ الإعدادات')
      console.log('🔗 الأجهزة المرتبطة')
      console.log('➕ ربط جهاز')
      console.log('📞 الربط باستخدام رقم الهاتف')
      console.log('')
      console.log(`🔑 أدخل الكود: ${code}`)
      console.log('')
      console.log('⏳ في انتظار إكمال الربط...')
      console.log('')

    } catch (error) {
      console.log('')
      console.log('❌ فشل الحصول على كود الربط')
      console.error(error?.message || error)
      console.log('')
    }
  } else if (state.creds.registered) {
    console.log('✅ جلسة session موجودة')
    console.log('⏳ جاري الاتصال بواتساب...')
    console.log('')
  }

  conn.ev.on('connection.update', async update => {
    const {
      connection,
      lastDisconnect
    } = update

    if (connection === 'open') {
      syncOwners()
      try { conn.newsletterFollow?.(CHANNEL_JID)?.catch?.(() => {}) } catch {}
      console.log(CREDIT_LINE)
      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('       ✅ تم ربط البوت بنجاح')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      console.log(`🤖 الحساب: ${conn.user?.id || 'غير معروف'}`)
      console.log('🚀 Hammam يعمل الآن')
      console.log('')
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode

      console.log('')
      console.log('⚠️ تم إغلاق اتصال واتساب')
      console.log(`📌 السبب: ${statusCode ?? 'غير معروف'}`)
      console.log('')

      if (
        statusCode ===
        DisconnectReason.loggedOut
      ) {
        console.log('❌ تم تسجيل خروج الحساب')
        console.log('⚠️ لم يتم حذف session')
        return
      }

      console.log('🔄 إعادة الاتصال خلال 5 ثوانٍ...')

      setTimeout(() => {
        startBot().catch(error => {
          console.error(
            '❌ خطأ أثناء إعادة التشغيل:',
            error
          )
        })
      }, 5000)
    }
  })

  conn.ev.on('messages.upsert', async update => {
    try {
      if (global.panelState?.paused) return // إيقاف مؤقت من اللوحة
      await handler.call(conn, update)
    } catch (error) {
      console.error(
        '❌ خطأ في handler:',
        error
      )
    }
  })

  conn.ev.on(
    'group-participants.update',
    async update => {
      try {
        if (global.panelState?.paused) return
        await participantsUpdate.call(
          conn,
          update
        )
      } catch (error) {
        console.error(
          '❌ خطأ في participantsUpdate:',
          error
        )
      }
    }
  )

  conn.ev.on('group.join-request', async update => {
    try {
      await joinRequestUpdate.call(conn, update)
    } catch (error) {
      console.error('❌ خطأ في joinRequestUpdate:', error)
    }
  })

  conn.ev.on('groups.update', async update => {
    try {
      await groupsUpdate.call(
        conn,
        update
      )
    } catch (error) {
      console.error(
        '❌ خطأ في groupsUpdate:',
        error
      )
    }
  })

  conn.ev.on('call', async update => {
    try {
      await callUpdate.call(
        conn,
        update
      )
    } catch (error) {
      console.error(
        '❌ خطأ في callUpdate:',
        error
      )
    }
  })

  conn.ev.on(
    'messages.delete',
    async update => {
      try {
        await deleteUpdate.call(
          conn,
          update
        )
      } catch (error) {
        console.error(
          '❌ خطأ في deleteUpdate:',
          error
        )
      }
    }
  )
}

process.on(
  'uncaughtException',
  error => {
    console.error(
      '❌ uncaughtException:',
      error
    )
  }
)

process.on(
  'unhandledRejection',
  error => {
    console.error(
      '❌ unhandledRejection:',
      error
    )
  }
)

startBot().catch(error => {
  console.error(
    '❌ فشل تشغيل البوت:',
    error
  )
})