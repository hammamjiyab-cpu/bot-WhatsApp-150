# Hammam Bot — Setup Guide (English)

A WhatsApp bot built with Node.js and Baileys. This guide takes you from zero to a linked, working bot.

> Developed by **Hammam Jiyab** · Channel: https://whatsapp.com/channel/0029VbClAWDFXUuh4N1kdf2A

---

## 1) Requirements

| Item | Notes |
|---|---|
| **Node.js 20.12 or newer** | Check with `node -v` |
| **Git** | To download the project |
| **FFmpeg** | Needed for stickers, audio and video commands |
| A WhatsApp number | The account the bot will run on |

### Termux (Android)

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git ffmpeg libwebp -y
termux-wake-lock
```

### Linux / VPS / Windows

Install Node.js (LTS), Git and FFmpeg from their official sites, then continue below.

---

## 2) Download and install

```bash
git clone https://github.com/hammamjiyab-cpu/<your-repository-name>.git
cd <your-repository-name>
npm install
```

`npm install` also installs the translation library used by the language switch.

---

## 3) Configure (one file only)

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
DEV_NUMBER=9677XXXXXXXX     # YOUR number: country code + number, digits only (no + or spaces)
BOT_NUMBER=9677XXXXXXXX     # the number the bot runs on (can be the same). Leave empty to be asked on first run
BOT_LANG=ar                 # reply language: ar, en, fr, es, tr, de, ru, id, hi, ur ...
```

- `DEV_NUMBER` makes you the developer: you can use developer-only commands.
- Everything else is optional. Never share or upload your `.env`.

---

## 4) First run and linking WhatsApp (pairing code)

```bash
npm start
```

1. If `BOT_NUMBER` is empty, the terminal asks for the number. Type it with the country code, digits only.
2. After a few seconds a code like `ABCD-1234` appears in the terminal.
3. On the phone that has this WhatsApp account:
   - Open WhatsApp → **Settings** → **Linked devices** → **Link a device**
   - Tap **Link with phone number instead**
   - Type the code from the terminal.
4. Wait until the terminal prints **"connected"**. The bot is now online.

The login is saved in the `session/` folder, so you only link once.
**Never share or upload `session/`** — anyone who has it controls your WhatsApp account.

### Test it

Send these to the bot (any chat):

- `.اوامر` — opens the commands menu
- `.owner` — shows the developer card

---

## 5) Change the language of the whole bot

Pick one:

- Edit `BOT_LANG=en` in `.env` and restart, or
- Send `.لغة en` from your developer number (changes it instantly, no restart).

All bot replies are translated from Arabic to the chosen language (links, mentions and `code` stay untouched).
Translations are cached in `data/` so repeated replies are fast.
Notes: the command words themselves stay Arabic (for example `.اوامر`), and button-card messages may stay Arabic.

---

## 6) Change the bot name

```bash
npm run rename -- "Hammam Bot" "My New Name"
```

The developer credit and channel line live in `core/credits.js` and are part of the project.
The bot sends that credit line once every 10 commands.

---

## 7) Optional features

| Feature | What to do |
|---|---|
| **Firebase backup** | Create your own Firebase project, download a service-account key, save it as `firebase-service-account.json`. Without it the bot uses local files and works normally. |
| **AI / speech commands** | Add `GROQ_API_KEY` and/or `GLADIA_API_KEY` to `.env`. Without them those commands will not work. |
| **Instagram / Pinterest download cookies** | Put your own cookie files in `cookies/` (see `cookies/README.txt`). |
| **Control panel** | Starts automatically on port `3000` (change with `PANEL_PORT`). |

---

## 8) Keep it running

```bash
npm install -g pm2
pm2 start index.js --name hammam-bot
pm2 save
```

On Termux you can simply leave `npm start` running with `termux-wake-lock` on.

---

## 9) Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module ...` | Run `npm install` again |
| No pairing code appears | Check the number format (digits only, with country code) and your internet connection |
| Code rejected by WhatsApp | Delete the `session/` folder and run `npm start` again |
| `sharp` fails to install on Termux | Try `pkg install libvips binutils -y` then `npm install`; or run the bot on a PC/VPS |
| Commands do not answer | Send `.اوامر تشغيل` in the chat (developer only) |
| Sticker or video commands fail | Make sure FFmpeg is installed: `ffmpeg -version` |
| Bot logged out | Delete `session/`, run `npm start`, link again |

---

## 10) Security checklist

- Never upload `.env`, `session/`, `subbots/`, `cookies/` or `firebase-service-account.json` (they are already in `.gitignore`).
- Keep API keys only in `.env`.
- If a key was ever pushed to GitHub, revoke it and create a new one.

Enjoy! 🚀
