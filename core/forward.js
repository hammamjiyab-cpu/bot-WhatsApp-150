// core/forward.js — يخلي ردود البوت تظهر "معاد توجيهها من القناة"
// تعديل شكل الإعادة: forwardingScore (999 = الشكل الشائع، 1 = أخف)

export function forwardContext() {
  const jid = global.ch?.ch1
  if (!jid) return null
  return {
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
      newsletterJid: jid,
      newsletterName: global.botName || 'Bot',
      serverMessageId: 100
    }
  }
}

// أنواع الرسائل اللي ما تقبل contextInfo (تفاعل، حذف، استفتاء...)
const SKIP = ['react', 'delete', 'poll', 'edit', 'forward', 'protocolMessage']

export function withForward(content) {
  const ctx = forwardContext()
  if (!ctx || !content || typeof content !== 'object') return content
  if (SKIP.some(k => k in content)) return content
  return { ...content, contextInfo: { ...ctx, ...(content.contextInfo || {}) } }
}

// يرجّع نسخة من conn كل sendMessage فيها يضيف علامة الإعادة. باقي الدوال تشتغل عادي.
export function forwardConn(conn) {
  return new Proxy(conn, {
    get(target, prop) {
      if (prop === 'sendMessage') {
        return (jid, content, options) => target.sendMessage(jid, withForward(content), options)
      }
      const value = Reflect.get(target, prop, target)
      return typeof value === 'function' ? value.bind(target) : value
    }
  })
}
