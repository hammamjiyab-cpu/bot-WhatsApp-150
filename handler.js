// handler.js — الموجّه: يوزّع الرسائل والأحداث بين هيندر 1 (حماية) وهيندر 2 (أوامر)
// يحافظ على نفس أسماء الـ exports القديمة عشان index.js وبلوقن التنصيب يشتغلون بدون تعديل
import * as protection from './handler1.js'
import * as commands from './handler2.js'
import { getModes, setMode, resetChat, hasOwnModes } from './core/modes.js'

const CONTROL = /^\.(اوامر|الاوامر|حماي[ةه])\s+(تشغيل|ايقاف|إيقاف|on|off)$/i

function statusText(conn, chat, modes) {
  const s = v => (v ? '🟢 شغّال' : '🔴 مطفي')
  const isGroup = chat.endsWith('@g.us')
  const scope = isGroup
    ? (hasOwnModes(conn, chat) ? '📍 هذا القروب (هيئة خاصة)' : '📍 هذا القروب (الهيئة الافتراضية)')
    : '📍 الهيئة الافتراضية (للخاص والقروبات بدون هيئة خاصة)'
  return (
    `⚙️ *هيئة البوت*\n${scope}\n\n` +
    `🛡️ الحماية: ${s(modes.protection)}\n` +
    `🧩 الأوامر: ${s(modes.commands)}\n\n` +
    `▫️ .حماية تشغيل / .حماية ايقاف\n` +
    `▫️ .اوامر تشغيل / .اوامر ايقاف\n` +
    `▫️ .هيئة — عرض الحالة\n` +
    (isGroup ? `▫️ .هيئة افتراضي — يرجّع القروب للافتراضية\n` : '') +
    (isGroup ? '' : `\n💡 في القروب: الأوامر أعلاه تغيّر هذا القروب فقط.`)
  )
}

// أوامر التحكم بالهيئة: للمطور فقط، وتشتغل حتى لو الوضعين مطفيين
async function handleControl(conn, message) {
  if (!message?.message || message.key?.fromMe) return false

  const text = protection.readCommandText(message)
  const isStatus = /^\.هيئ[ةه]$/.test(text)
  const isReset = /^\.هيئ[ةه]\s+(افتراضي|افتراضيه|افتراضية|الافتراضي)$/.test(text)
  const control = text.match(CONTROL)
  if (!isStatus && !isReset && !control) return false

  if (!(await protection.isDeveloper(conn, message))) return false

  const chat = message.key.remoteJid
  const reply = t => conn.sendMessage(chat, { text: t }, { quoted: message })

  if (isStatus) {
    await reply(statusText(conn, chat, getModes(conn, chat)))
    return true
  }

  if (isReset) {
    if (!chat.endsWith('@g.us')) {
      await reply('ℹ️ هذا الأمر داخل القروب فقط.')
      return true
    }
    const modes = resetChat(conn, chat)
    await reply(`↩️ رجع القروب للهيئة الافتراضية\n\n${statusText(conn, chat, modes)}`)
    return true
  }

  const key = /^(اوامر|الاوامر)$/.test(control[1]) ? 'commands' : 'protection'
  const on = /^(تشغيل|on)$/i.test(control[2])
  const modes = setMode(conn, chat, key, on)
  const label = key === 'commands' ? '🧩 الأوامر' : '🛡️ الحماية'
  await reply(`${on ? '✅ تم تشغيل' : '⏹️ تم إيقاف'} ${label}\n\n${statusText(conn, chat, modes)}`)
  return true
}

export async function handler(update) {
  const conn = this

  if (update?.type && update.type !== 'notify') return
  const messages = update?.messages || []
  if (!messages.length) return

  // كل رسالة تتعامل مع هيئة قروبها الخاص
  for (const message of messages) {
    // 1) أوامر التحكم
    try {
      if (await handleControl(conn, message)) continue
    } catch (e) {
      console.error('❌ خطأ في أوامر الهيئة:', e)
    }

    const chat = message?.key?.remoteJid || ''
    const modes = getModes(conn, chat)
    const single = { ...update, messages: [message] }

    // 2) هيندر 1: الحماية (حارس + عدّ + أوامر الإدارة)
    if (modes.protection) {
      try {
        await protection.handler.call(conn, single)
      } catch (e) {
        console.error('❌ خطأ في هيندر الحماية:', e)
      }
    }

    // 3) هيندر 2: الأوامر (البلوقنات)
    if (modes.commands) {
      try {
        // إذا الحماية شغالة ورسالة أمر حماية (مثل .رفع / .اوامر للمطور والنخبة): ما نكررها
        if (modes.protection && (await protection.handlesMessage(conn, message))) continue
        await commands.handler.call(conn, single)
      } catch (e) {
        console.error('❌ خطأ في هيندر الأوامر:', e)
      }
    }
  }
}

// دخول/خروج الأعضاء وطلبات الانضمام: الحماية هي صاحبة الحدث، وإذا الحماية مطفية يروح للأوامر
export async function participantsUpdate(update) {
  const modes = getModes(this, update?.id)
  if (modes.protection) return protection.participantsUpdate.call(this, update)
  if (modes.commands) return commands.participantsUpdate.call(this, update)
}

export async function joinRequestUpdate(update) {
  if (getModes(this, update?.id).protection) return protection.joinRequestUpdate.call(this, update)
}

// هيندر 1 ما عنده منطق لهذي الثلاثة (فاضية)، فإذا الأوامر شغالة تروح لهيندر 2
export async function groupsUpdate(update) {
  const chat = Array.isArray(update) ? update[0]?.id : update?.id
  const modes = getModes(this, chat)
  if (modes.commands) return commands.groupsUpdate.call(this, update)
  if (modes.protection) return protection.groupsUpdate.call(this, update)
}

export async function callUpdate(update) {
  const modes = getModes(this, '')
  if (modes.commands) return commands.callUpdate.call(this, update)
  if (modes.protection) return protection.callUpdate.call(this, update)
}

export async function deleteUpdate(update) {
  const chat = update?.remoteJid || update?.jid || update?.keys?.[0]?.remoteJid || ''
  const modes = getModes(this, chat)
  if (modes.commands) return commands.deleteUpdate.call(this, update)
  if (modes.protection) return protection.deleteUpdate.call(this, update)
}
