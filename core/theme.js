// core/theme.js
// ✦ الثيم الموحّد للبوت — شكل واحد، رسالة واحدة، وعبارات (فخر · دين · كاريزما) ✦
// نفس الواجهة القديمة (theme.build / theme.divider ...) فكل الأوامر تشتغل بدون تغيير.

const TOP = '╭━━━━━━━━━ ❖ ━━━━━━━━━┈'
const END = '╰━━━━━━━━━ ❖ ━━━━━━━━━┈'
const MID = '├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈'
const BAR = '│'

// ───────────── العبارات ─────────────
export const phrases = {
  religion: [
    'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    'لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ',
    'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    'فَاذْكُرُونِي أَذْكُرْكُمْ',
    'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    'اللهم صلِّ وسلِّم على نبينا محمد',
    'حسبنا الله ونعم الوكيل',
    'أستغفر الله العظيم وأتوب إليه',
  ],
  pride: [
    'اليمن أصل العرب، ومنبت الأصالة والعزّ 🇾🇪',
    'نفخر بجذورنا، ونمضي بعزيمة الرجال',
    'عزّ الرجال في أفعالهم لا في ضجيجهم',
    'من أرض الحكمة والإيمان خرجنا، وبالهمّة نصنع الفرق',
    'الفخر الحقيقي أن تبقى أصيلاً مهما تغيّر الزمان',
    'نحن أبناء المجد، نكتب التاريخ ولا نقرؤه فقط',
    'الشرف تاج لا يشتريه مال ولا يبلغه كسول',
  ],
  charisma: [
    'الثقة لا تحتاج إلى صوتٍ عالٍ',
    'كن أنت الحدث ولا تنتظره',
    'من ملك نفسه ملك الطريق',
    'الهيبة تُصنع بالهدوء والإتقان',
    'العظماء لا يطلبون الانتباه، بل يفرضونه بإنجازهم',
    'اصنع أثراً يُذكر، لا ضجيجاً يُنسى',
    'الذكاء أن تعرف متى تتكلم، والحكمة أن تعرف متى تصمت',
  ],
}

const order = ['religion', 'pride', 'charisma']
let turn = Math.floor(Math.random() * 3)

/** عبارة واحدة بالتناوب بين الدين والفخر والكاريزما */
export function pickPhrase(kind) {
  const k = kind && phrases[kind] ? kind : order[turn++ % order.length]
  const pool = phrases[k]
  return pool[Math.floor(Math.random() * pool.length)]
}

// ───────────── تنظيف النصوص القديمة (2B / YoRHa / علامات الاقتباس) ─────────────
const BRAND = 'Hammam Bot'
const clean = (s) => String(s ?? '')
  .replace(/(?:❄️\s*)?✧?\s*𝟐𝐁\s*-\s*YoRHa Unit(?:\s*No\.2 Type B)?\s*✧?/g, BRAND)
  .replace(/\b2B\s*:\s*/g, '')
  .replace(/^❄️\s*/, '')
const cleanTitle = (s) => clean(s).replace(/["“”]/g, '').replace(/\s{2,}/g, ' ').trim()

// ───────────── البناء ─────────────
const lines = (s) => String(s ?? '').split('\n')
const row = (s) => lines(s).map((l) => (l.trim() ? `${BAR} ${l}` : BAR)).join('\n')

/**
 * theme.build([{type, text, label, value}], {footer:false, phrase:'pride'})
 * يرجّع نص واحد جاهز للإرسال.
 */
function build(blocks = [], opts = {}) {
  if (typeof blocks === 'string') blocks = [{ type: 'line', text: blocks }]
  const out = [TOP]
  let titled = false
  let hasError = false
  let lastWasDivider = false

  for (const b of blocks) {
    if (!b) continue
    const t = b.type || 'line'
    const text = clean(b.text ?? b.value ?? '')
    lastWasDivider = false
    switch (t) {
      case 'title':
        { const tt = cleanTitle(text)
          if (!titled) { out.push(row(`✦ *${tt}* ✦`)); titled = true }
          else { out.push(MID); out.push(row(`✧ *${tt}*`)) } }
        break
      case 'subtitle':
        out.push(row(`❖ _${cleanTitle(text)}_`))
        break
      case 'info':
        out.push(row(`◈ *${clean(b.label ?? '')}* ⟵ ${clean(b.value ?? text)}`))
        break
      case 'line':
      case 'text':
        out.push(row(text))
        break
      case 'divider':
        out.push(MID); lastWasDivider = true
        break
      case 'spacer':
        out.push(BAR)
        break
      case 'success':
        out.push(row(`✅ ${text}`))
        break
      case 'warning':
        out.push(row(`⚠️ ${text}`))
        break
      case 'error':
        hasError = true
        out.push(row(`❌ ${text}`))
        break
      case 'tip':
        out.push(row(`💡 ${text}`))
        break
      case 'quote':
        out.push(row(`❝ ${text} ❞`))
        break
      default:
        if (text) out.push(row(text))
    }
  }

  if (opts.footer !== false && !hasError) {
    if (!lastWasDivider) out.push(MID)
    out.push(row(`❝ ${pickPhrase(opts.phrase)} ❞`))
  }
  out.push(END)
  return out.join('\n')
}

// ───────────── اختصارات جاهزة ─────────────
const helpers = {
  build,
  box: (title, body = [], opts) =>
    build([{ type: 'title', text: title }, { type: 'divider' },
      ...[].concat(body).map((text) => ({ type: 'line', text }))], opts),
  error: (text) => build([{ type: 'title', text: 'تـنـبـيـه' }, { type: 'error', text }], { footer: false }),
  warning: (text) => build([{ type: 'title', text: 'تـنـبـيـه' }, { type: 'warning', text }], { footer: false }),
  success: (text) => build([{ type: 'title', text: 'تـمّ بـنـجـاح' }, { type: 'success', text }]),
  usage: (title, usage, example) =>
    build([
      { type: 'title', text: title }, { type: 'divider' },
      { type: 'info', label: 'الاستخدام', value: usage },
      ...(example ? [{ type: 'info', label: 'مثال', value: example }] : []),
    ]),
  pick: pickPhrase,
  phrases,
  // ثوابت قديمة تستخدمها بعض الملفات
  divider: TOP,
  endDivider: END,
  smallDivider: MID,
  darkStar: '✦',
  target: '◈',
  sword: '❖',
  eye: '✧',
  blood: '❖',
}

export const theme = new Proxy(helpers, {
  get(t, k) {
    if (k in t) return t[k]
    if (typeof k === 'symbol' || k === 'then') return undefined
    return '✦' // أي ثابت غير معروف لا يكسر الأمر
  },
})

export default theme