<div align="center">

# 🤖 Hammam Bot

**A powerful WhatsApp bot built with Node.js & Baileys**
**بوت واتساب قوي مبني بـ Node.js و Baileys**

[![GitHub](https://img.shields.io/badge/GitHub-hammamjiyab--cpu-181717?logo=github)](https://github.com/hammamjiyab-cpu)
[![WhatsApp Channel](https://img.shields.io/badge/WhatsApp-Channel-25D366?logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VbClAWDFXUuh4N1kdf2A)

</div>

---

## 📑 Contents · المحتويات

1. [Download the bot · تنزيل البوت](#1-download-the-bot--تنزيل-البوت)
2. [Free server (Katabump) · السيرفر المجاني](#2-free-server-katabump--السيرفر-المجاني)
3. [Setup & link WhatsApp · الإعداد والربط](#3-setup--link-whatsapp--الإعداد-والربط)
4. [Change the language · تغيير اللغة](#4-change-the-language--تغيير-اللغة)
5. [Add your own commands · إضافة أوامر](#5-add-your-own-commands--إضافة-أوامر)
6. [Security rules · قواعد الأمان](#6-security-rules--قواعد-الأمان)

---

## 1. Download the bot · تنزيل البوت

### 🇬🇧 English

**Repository:** https://github.com/hammamjiyab-cpu/bot-WhatsApp-150

**From your phone (easiest):**

1. Open the repository link above in your browser.
2. Tap the green **Code** button.
3. Tap **Download ZIP**.
4. Open your *Downloads* folder and extract the ZIP file (long-press → *Extract*).
5. You will get a folder containing `index.js`, `settings.js`, `plugins/`, `core/`, etc.

**From Termux / a computer:**

```bash
git clone https://github.com/hammamjiyab-cpu/bot-WhatsApp-150.git
cd bot-WhatsApp-150
npm install
```

<div dir="rtl">

### 🇾🇪 العربية

**رابط المستودع:** https://github.com/hammamjiyab-cpu/bot-WhatsApp-150

**من الجوال (الأسهل):**

1. افتح رابط المستودع أعلاه في المتصفح.
2. اضغط على الزر الأخضر **Code**.
3. اضغط **Download ZIP**.
4. افتح مجلد التنزيلات وفك ضغط الملف (اضغط مطولاً ← *Extract*).
5. ستحصل على مجلد فيه `index.js` و`settings.js` و`plugins/` و`core/` وغيرها.

**من Termux أو الحاسوب:** استخدم الأوامر الموضحة في القسم الإنجليزي أعلاه.

</div>

---

## 2. Free server (Katabump) · السيرفر المجاني

### 🇬🇧 English

Run the bot 24/7 on a free hosting platform:

🌐 **Platform:** https://katabump.com

**Steps:**

1. Create an account on Katabump and verify your email.
2. Open the dashboard and create a new **Node.js** server.
3. Upload the bot files (the extracted ZIP) to the server's file manager, so that `index.js` is in the main folder.
4. Set your numbers in `settings.js` (see section 3).
5. Start the server and read the pairing code from the console.

> ⚠️ Free servers have limited resources, and some free plans ask you to press a *renew* button every few days to stay online.

📺 **Full step-by-step explanation:** `[ضع هنا رابط الشرح · PUT THE EXPLANATION LINK HERE]`

<div dir="rtl">

### 🇾🇪 العربية

شغّل البوت على مدار الساعة عبر منصة استضافة مجانية:

🌐 **المنصة:** https://katabump.com

**الخطوات:**

1. أنشئ حساباً في Katabump وفعّل بريدك الإلكتروني.
2. افتح لوحة التحكم وأنشئ سيرفراً جديداً من نوع **Node.js**.
3. ارفع ملفات البوت (بعد فك الضغط) إلى مدير الملفات في السيرفر، بحيث يكون `index.js` في المجلد الرئيسي.
4. اكتب أرقامك في ملف `settings.js` (انظر القسم 3).
5. شغّل السيرفر وانتظر ظهور كود الربط في الكونسول.

> ⚠️ السيرفرات المجانية مواردها محدودة، وبعض الخطط المجانية تطلب منك الضغط على زر *تجديد* كل بضعة أيام ليبقى السيرفر شغالاً.

📺 **الشرح الكامل خطوة بخطوة:** `[ضع هنا رابط الشرح · PUT THE EXPLANATION LINK HERE]`

</div>

---

## 3. Setup & link WhatsApp · الإعداد والربط

### 🇬🇧 English

Open `settings.js` and write your numbers inside quotes — country code + number, digits only (no `+`, no spaces):

```js
global.DEV_NUMBER = '9677XXXXXXXX'      // your number (developer)
global.botNumberCode = '9677XXXXXXXX'   // the number the bot runs on
```

Start the bot. A pairing code like `ABCD-1234` appears in the console. Then on the phone of that number:

**WhatsApp → Settings → Linked devices → Link a device → Link with phone number instead → enter the code.**

When the console says the bot is connected, send `.اوامر` to open the commands menu.

> If the code does not appear, delete the `session` folder and restart. Never share the `session` folder: whoever has it controls your WhatsApp account.

<div dir="rtl">

### 🇾🇪 العربية

افتح ملف `settings.js` واكتب أرقامك بين علامتي اقتباس — رمز الدولة ثم الرقم، أرقام فقط (بدون `+` وبدون مسافات):

```js
global.DEV_NUMBER = '9677XXXXXXXX'      // رقمك (المطور)
global.botNumberCode = '9677XXXXXXXX'   // الرقم الذي سيعمل عليه البوت
```

شغّل البوت، سيظهر في الكونسول كود ربط مثل `ABCD-1234`. ثم من هاتف نفس الرقم:

**واتساب ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← الربط باستخدام رقم الهاتف ← اكتب الكود.**

عند ظهور رسالة اتصال البوت في الكونسول، أرسل `.اوامر` لفتح قائمة الأوامر.

> إذا لم يظهر الكود، احذف مجلد `session` وأعد التشغيل. لا تشارك مجلد `session` مع أحد: من يملكه يتحكم في حساب واتساب الخاص بك.

</div>

---

## 4. Change the language · تغيير اللغة

### 🇬🇧 English

All bot replies can be translated automatically — no code changes needed.

| Method | How |
|---|---|
| In settings | Set `global.LANG = 'en'` in `settings.js`, or `BOT_LANG=en` in `.env` |
| Live command | Send `.لغة en` from the developer number (instant, no restart) |

Supported codes: `ar` `en` `fr` `es` `tr` `de` `ru` `id` `hi` `ur` and most other languages.
Command words stay Arabic (for example `.اوامر`).

<div dir="rtl">

### 🇾🇪 العربية

يمكن ترجمة جميع ردود البوت تلقائياً دون أي تعديل في الكود.

| الطريقة | الخطوات |
|---|---|
| من الإعدادات | اكتب `global.LANG = 'en'` في `settings.js` أو `BOT_LANG=en` في `.env` |
| بالأمر مباشرة | أرسل `.لغة en` من رقم المطور (فوري ودون إعادة تشغيل) |

رموز اللغات: `ar` `en` `fr` `es` `tr` `de` `ru` `id` `hi` `ur` ومعظم اللغات الأخرى.
كلمات الأوامر تبقى عربية (مثل `.اوامر`).

</div>

---

## 5. Add your own commands · إضافة أوامر

### 🇬🇧 English

Every command is one file inside the `plugins/` folder.

**Step 1 — Create the file** `plugins/hello.js`:

```js
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`Example: ${usedPrefix}${command} Ahmed`)
  await m.reply(`👋 Hello ${text}! — ${global.botName}`)
}

handler.help = ['hello <name>']
handler.tags = ['tools']
handler.command = ['hello', 'مرحبا']   // the words that trigger the command

export default handler
```

**Step 2 — Restart the server**, then send `.hello Ahmed`.

**Step 3 (optional) — Show it in the menu:** open the menu file of the matching section (`plugins/ق*.js`), find the right group and add a line like `["hello", "Say hello"]` to its `items` list.

#### ✅ Requirements

| # | Rule |
|---|---|
| 1 | The file must be inside `plugins/` and end with `.js`. |
| 2 | Use modern JavaScript modules: `export default handler` and `import` (never `require`). |
| 3 | It must define `handler.command` (an array, a string or a regex), and the names must not already be used by another command. |
| 4 | Reply with `m.reply(...)` or `conn.sendMessage(...)` so the language switch also translates it. |
| 5 | Never write phone numbers, API keys or links of other people inside the code. Use `global.owner`, `global.botName` and `process.env.YOUR_KEY` (keys go in `.env`). |
| 6 | No dangerous code: no shell execution (`exec`), no crash/bug messages, no sending bot files or data outside, no auto-following other channels. |
| 7 | Do not remove or edit the credit line in `core/credits.js`. |
| 8 | Check for errors before uploading: `node --check plugins/hello.js` |

#### 🔐 Permission flags (optional)

Add any of these lines before `export default handler`:

| Flag | Meaning |
|---|---|
| `handler.rowner = true` | Developer only |
| `handler.owner = true` | Owner only |
| `handler.premium = true` | Premium users only |
| `handler.group = true` | Works in groups only |
| `handler.private = true` | Works in private chat only |
| `handler.admin = true` | Group admins only |
| `handler.botAdmin = true` | The bot must be a group admin |
| `handler.disabled = true` | Temporarily disable the command |

<div dir="rtl">

### 🇾🇪 العربية

كل أمر عبارة عن ملف واحد داخل مجلد `plugins/`.

**الخطوة 1 — أنشئ الملف** `plugins/hello.js`:

```js
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`مثال: ${usedPrefix}${command} أحمد`)
  await m.reply(`👋 أهلاً ${text}! — ${global.botName}`)
}

handler.help = ['hello <name>']
handler.tags = ['tools']
handler.command = ['hello', 'مرحبا']   // الكلمات التي تشغّل الأمر

export default handler
```

**الخطوة 2 — أعد تشغيل السيرفر** ثم أرسل `.hello أحمد`.

**الخطوة 3 (اختياري) — إظهاره في القائمة:** افتح ملف القائمة المناسب للقسم (`plugins/ق*.js`) وابحث عن المجموعة الصحيحة، ثم أضف سطراً مثل `["hello", "قول مرحبا"]` داخل قائمة `items`.

#### ✅ الشروط

| # | القاعدة |
|---|---|
| 1 | يجب أن يكون الملف داخل `plugins/` وينتهي بـ `.js`. |
| 2 | استخدم وحدات JavaScript الحديثة: `export default handler` و`import` (ولا تستخدم `require` أبداً). |
| 3 | يجب تعريف `handler.command` (مصفوفة أو نص أو تعبير نمطي)، ولا يجوز أن تكون أسماؤه مستخدمة في أمر آخر. |
| 4 | أرسل الرد عبر `m.reply(...)` أو `conn.sendMessage(...)` حتى تعمل الترجمة التلقائية عليه. |
| 5 | لا تكتب أرقام هواتف أو مفاتيح API أو روابط أشخاص آخرين داخل الكود. استخدم `global.owner` و`global.botName` و`process.env.YOUR_KEY` (والمفاتيح تُحفظ في `.env`). |
| 6 | ممنوع الكود الخطير: لا تنفيذ أوامر شل (`exec`)، ولا رسائل تعليق أو تخريب، ولا إرسال ملفات البوت أو بياناته للخارج، ولا متابعة قنوات الآخرين تلقائياً. |
| 7 | لا تحذف ولا تعدّل سطر الحقوق في `core/credits.js`. |
| 8 | افحص الأخطاء قبل الرفع: `node --check plugins/hello.js` |

#### 🔐 أعلام الصلاحيات (اختيارية)

أضف أياً من هذه الأسطر قبل `export default handler`:

| العلم | المعنى |
|---|---|
| `handler.rowner = true` | للمطور فقط |
| `handler.owner = true` | للمالك فقط |
| `handler.premium = true` | للمشتركين المميزين فقط |
| `handler.group = true` | يعمل في المجموعات فقط |
| `handler.private = true` | يعمل في الخاص فقط |
| `handler.admin = true` | لمشرفي المجموعة فقط |
| `handler.botAdmin = true` | يجب أن يكون البوت مشرفاً |
| `handler.disabled = true` | تعطيل الأمر مؤقتاً |

</div>

---

## 6. Security rules · قواعد الأمان

### 🇬🇧 English

- 🔒 **Never upload** `session/`, `subbots/`, `.env`, `cookies/` or `firebase-service-account.json` to GitHub (they are already listed in `.gitignore`).
- 🔑 Keep API keys only in `.env`. If a key was ever published, revoke it and create a new one.
- 📱 Prefer a **separate number** for the bot; WhatsApp may restrict numbers used by bots.
- 🧪 Use the bot responsibly and follow WhatsApp's terms of service.

<div dir="rtl">

### 🇾🇪 العربية

- 🔒 **لا ترفع أبداً** مجلدات `session/` و`subbots/` و`cookies/` أو ملفات `.env` و`firebase-service-account.json` إلى GitHub (وهي مضافة مسبقاً في `.gitignore`).
- 🔑 احفظ مفاتيح API في `.env` فقط، وإذا نُشر مفتاح من قبل فألغِه وأنشئ مفتاحاً جديداً.
- 📱 يفضَّل استخدام **رقم منفصل** للبوت، فقد تقيّد واتساب الأرقام التي تعمل عليها بوتات.
- 🧪 استخدم البوت بمسؤولية والتزم بشروط خدمة واتساب.

</div>

---

<div align="center">

**Developed by Hammam Jiyab · طُوّر بواسطة همام جياب**
📢 [WhatsApp Channel](https://whatsapp.com/channel/0029VbClAWDFXUuh4N1kdf2A) · 💻 [GitHub](https://github.com/hammamjiyab-cpu)

</div>
