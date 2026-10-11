// lib/identity.js — أدوات الهوية (JID / LID) المستخدمة في ترحيب-وداع.js
const lidToPn = new Map() // '123@lid' -> '9665xxxx@s.whatsapp.net'

const bare = jid => String(jid || '').replace(/:\d+(?=@)/, '') // يشيل رقم الجهاز 123:4@...

// يحفظ ربط LID -> رقم من قائمة أعضاء القروب
export function rememberParticipants(participants = []) {
  for (const p of participants || []) {
    const id = bare(p?.id)
    const lid = bare(p?.lid || (id.endsWith('@lid') ? id : ''))
    const pn = bare(p?.phoneNumber || p?.jid || (id.endsWith('@s.whatsapp.net') ? id : ''))
    if (lid.endsWith('@lid') && pn.endsWith('@s.whatsapp.net')) lidToPn.set(lid, pn)
  }
}

// يطلع الـJID من باراميتر رسالة القروب (نص، أو JSON، أو كائن)
export function extractJidFromParam(param) {
  if (!param) return null
  let v = param
  if (typeof v === 'string') {
    const t = v.trim()
    if (t.startsWith('{')) {
      try { v = JSON.parse(t) } catch { return null }
    } else {
      return t.includes('@') ? t : (/^\d{5,}$/.test(t) ? `${t}@s.whatsapp.net` : null)
    }
  }
  if (typeof v === 'object') {
    const c = v.phoneNumber || v.jid || v.id || v.lid
    return typeof c === 'string' && c ? extractJidFromParam(c) : null
  }
  return null
}

// يوحّد الـJID: يشيل الجهاز، ويحوّل LID لرقم لو معروف
export function normalizeJid(jid = '') {
  const j = bare(jid)
  return j.endsWith('@lid') ? (lidToPn.get(j) || j) : j
}

// صالح للمنشن: رقم أو LID فقط (أرقام بدون رموز)
export function isMentionableJid(jid = '') {
  return /^\d{5,}@(s\.whatsapp\.net|lid)$/.test(String(jid))
}
