// بلوقن 2 (الحماية) — إدارة الأوامر من الواتساب بدون دخول السيرفر (مطور فقط)
//   .بلوقن2 اضف [اسم]   ← رد على كود أو ملف .js
//   .بلوقن2 عرض          ← قائمة أوامر الحماية
//   .بلوقن2 عرض <اسم>    ← يعرض الكود
//   .بلوقن2 حذف <اسم>
//   .بلوقن2 قالب         ← قالب جاهز تعدّل عليه
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import {
  PLUGINS2_DIR,
  loadPlugin2,
  removePlugin2,
  listPlugins2
} from '../core/plugins2-loader.js'

const SELF = 'بلوقن2.js' // محمي: ما ينحذف ولا ينكتب فوقه (عشان ما تقفل على نفسك)
const NAME_OK = /^[\p{L}\p{N}_-]{1,60}$/u
const MAX_CODE = 200_000

const TEMPLATE = `// plugins2/مثال.js
const plugin = async ({ send, args, isGroup, owner, elite, conn, chat, message, sender, h }) => {
  await send('هلا! ' + (args.join(' ') || 'بدون كلام'))
}

plugin.command = ['مثال']          // بدون نقطة. أو: /^\\.مثال(?: |$)/
plugin.help = '*.مثال* — وصف قصير'  // يظهر في .اوامر
plugin.access = 'elite'            // owner | elite | all
plugin.group = false               // true = القروبات فقط

export default plugin`

const MENU =
  `📦 *بلوقن 2 — أوامر الحماية*\n\n` +
  `➕ *.بلوقن2 اضف* [اسم] — رد على كود أو ملف .js\n` +
  `📋 *.بلوقن2 عرض* — قائمة الأوامر\n` +
  `📄 *.بلوقن2 عرض* <اسم> — عرض الكود\n` +
  `🗑️ *.بلوقن2 حذف* <اسم>\n` +
  `🧩 *.بلوقن2 قالب* — قالب جاهز`

// ───────────── أدوات مساعدة ─────────────

function unwrap(msg) {
  let m = msg
  for (let i = 0; i < 4 && m; i++) {
    const inner =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.documentWithCaptionMessage?.message
    if (!inner) break
    m = inner
  }
  return m || {}
}

function getQuoted(message) {
  const inner = unwrap(message?.message)
  for (const value of Object.values(inner)) {
    const q = value?.contextInfo?.quotedMessage
    if (q) return unwrap(q)
  }
  return null
}

async function readQuotedCode(quoted) {
  const doc = quoted.documentMessage
  if (doc) {
    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
    const stream = await downloadContentFromMessage(doc, 'document')
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    return { code: Buffer.concat(chunks).toString('utf8'), fileName: doc.fileName || '' }
  }
  const code =
    quoted.conversation ||
    quoted.extendedTextMessage?.text ||
    quoted.imageMessage?.caption ||
    ''
  return { code, fileName: '' }
}

// فحص الصياغة فقط (بدون تشغيل الكود) عن طريق node --check
function checkSyntax(code) {
  return new Promise(resolve => {
    const tmp = path.join(os.tmpdir(), `p2-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`)
    fs.writeFileSync(tmp, code, 'utf8')
    execFile(process.execPath, ['--check', tmp], { timeout: 15000 }, (err, _out, stderr) => {
      fs.rmSync(tmp, { force: true })
      if (!err) return resolve(null)
      const msg = String(stderr || err.message)
        .split('\n')
        .filter(line => line.trim() && !line.includes(tmp) && !/^\s+at /.test(line) && !/^Node\.js/.test(line))
        .slice(0, 6)
        .join('\n')
      resolve(msg || 'خطأ في صياغة الكود')
    })
  })
}

function cleanName(raw) {
  return String(raw || '')
    .replace(/\.js$/i, '')
    .trim()
    .replace(/\s+/g, '_')
}

function guessName(code) {
  const fromComment = code.match(/\/\/\s*plugins2\/([\p{L}\p{N}_-]+)\.js/u)
  if (fromComment) return fromComment[1]

  const fromString = code.match(/\.command\s*=\s*\[?\s*['"`]\.?([\p{L}\p{N}_-]+)['"`]/u)
  if (fromString) return fromString[1]

  const fromRegex = code.match(/\.command\s*=\s*\/\^\\?\.?\(?(?:\?:)?([\p{L}\p{N}_]+)/u)
  if (fromRegex) return fromRegex[1]

  return ''
}

function findFile(input) {
  const wanted = cleanName(input).toLowerCase()
  if (!wanted) return null
  const files = fs.readdirSync(PLUGINS2_DIR).filter(f => f.endsWith('.js'))
  return (
    files.find(f => f.replace(/\.js$/, '').toLowerCase() === wanted) ||
    files.find(f => f.toLowerCase().includes(wanted)) ||
    null
  )
}

function describeCommand(plugin) {
  const cmd = plugin.command
  if (cmd instanceof RegExp) return String(cmd)
  return [].concat(cmd).map(c => `.${String(c).replace(/^\./, '')}`).join(' | ')
}

const icon = p => (p.access === 'owner' ? '🔴' : p.access === 'all' ? '⚪' : '🟢')

// ───────────── الأوامر الفرعية ─────────────

async function add({ message, args, send }) {
  const quoted = getQuoted(message)
  if (!quoted) {
    await send('❌ رد على رسالة فيها كود البلوقن (أو ملف .js) واكتب:\n*.بلوقن2 اضف* [اسم]\n\nتبي قالب؟ اكتب *.بلوقن2 قالب*')
    return
  }

  let code, docName
  try {
    ;({ code, fileName: docName } = await readQuotedCode(quoted))
  } catch (e) {
    await send(`❌ فشل قراءة الملف: ${e.message}`)
    return
  }

  if (!code.trim()) {
    await send('❌ الرسالة اللي رديت عليها ما فيها كود.')
    return
  }
  if (code.length > MAX_CODE) {
    await send('❌ الكود كبير زيادة (الحد 200 ألف حرف).')
    return
  }

  const name = cleanName(args[1]) || cleanName(docName) || guessName(code) || `plugin_${Date.now().toString(36)}`
  if (!NAME_OK.test(name)) {
    await send('❌ اسم الملف غير صالح. استخدم حروف وأرقام و _ و - فقط.\nمثال: *.بلوقن2 اضف مثال*')
    return
  }

  const file = `${name}.js`
  if (file === SELF) {
    await send('⛔ هذا الملف محمي، اختر اسم ثاني.')
    return
  }

  const syntaxError = await checkSyntax(code)
  if (syntaxError) {
    await send(`❌ فيه خطأ في الكود، ما انحفظ:\n\n${syntaxError}`)
    return
  }

  const target = path.join(PLUGINS2_DIR, file)
  const existed = fs.existsSync(target)
  const backup = existed ? fs.readFileSync(target, 'utf8') : null

  fs.writeFileSync(target, code, 'utf8')

  let plugin
  try {
    plugin = await loadPlugin2(file)
  } catch (e) {
    // فشل التحميل: نرجّع الوضع كما كان
    if (existed) {
      fs.writeFileSync(target, backup, 'utf8')
      await loadPlugin2(file).catch(() => {})
    } else {
      fs.rmSync(target, { force: true })
      removePlugin2(file)
    }
    await send(`❌ الكود ما اشتغل عند التحميل، ما انحفظ:\n\n${String(e?.message || e).split('\n')[0]}`)
    return
  }

  await send(
    `${existed ? '✏️ تم التعديل' : '✅ تمت الإضافة'}: *${file}*\n` +
    `📌 الأمر: ${describeCommand(plugin)}\n` +
    `${icon(plugin)} الصلاحية: ${plugin.access || 'elite'}\n` +
    `⚡ شغّال الحين بدون إعادة تشغيل.`
  )
}

async function show({ conn, chat, args, send }) {
  const name = args.slice(1).join(' ')

  if (!name) {
    const rows = listPlugins2().map(
      ([file, p], i) => `${i + 1}. ${icon(p)} ${file.replace(/\.js$/, '')} — ${describeCommand(p)}`
    )
    await send(
      `📋 *أوامر الحماية (${rows.length})*\n🔴 مطور  🟢 نخبة  ⚪ الكل\n\n${rows.join('\n')}\n\n` +
      `📄 للكود: *.بلوقن2 عرض* <اسم>`
    )
    return
  }

  const file = findFile(name)
  if (!file) {
    await send(`❌ ما لقيت بلوقن باسم "${name}".`)
    return
  }

  const code = fs.readFileSync(path.join(PLUGINS2_DIR, file), 'utf8')

  if (code.length <= 3000) {
    await send(`📄 *${file}*\n\n\`\`\`\n${code}\n\`\`\``)
  } else {
    await conn.sendMessage(chat, {
      document: Buffer.from(code, 'utf8'),
      mimetype: 'text/javascript',
      fileName: file
    })
  }
}

async function remove({ args, send }) {
  const name = args.slice(1).join(' ')
  if (!name) {
    await send('📌 الاستخدام: *.بلوقن2 حذف* <اسم>')
    return
  }

  const file = findFile(name)
  if (!file) {
    await send(`❌ ما لقيت بلوقن باسم "${name}".`)
    return
  }
  if (file === SELF) {
    await send('⛔ هذا الملف محمي، ما ينحذف.')
    return
  }

  fs.rmSync(path.join(PLUGINS2_DIR, file), { force: true })
  removePlugin2(file)
  await send(`🗑️ تم حذف *${file}*`)
}

// ───────────── المدخل ─────────────

const plugin = async ctx => {
  const action = (ctx.args[0] || '').toLowerCase()

  if (/^(اضف|اضافه|اضافة|add)$/.test(action)) return add(ctx)
  if (/^(عرض|لست|قائمة|show|list)$/.test(action)) return show(ctx)
  if (/^(حذف|delete|remove)$/.test(action)) return remove(ctx)
  if (/^(قالب|template)$/.test(action)) return ctx.send(TEMPLATE)

  return ctx.send(MENU)
}

plugin.command = /^\.(?:بلوقن2|plugin2)(?: |$)/i
plugin.help = '*.بلوقن2* اضف / عرض / حذف / قالب — إدارة أوامر الحماية من الواتساب'
plugin.access = 'owner'
plugin.priority = 20

export default plugin
