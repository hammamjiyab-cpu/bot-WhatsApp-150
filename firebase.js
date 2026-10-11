// firebase.js — OPTIONAL cloud backup. The bot works without it (local JSON files are used).
// فايربيس اختياري: لو ما حطيت ملف المفتاح يشتغل البوت بالتخزين المحلي فقط.
//
// To enable it, put YOUR OWN service-account file at ./firebase-service-account.json
// (or set FIREBASE_KEY_FILE in .env). Never share or commit that file.
import fs from 'fs'

const KEY_FILE = process.env.FIREBASE_KEY_FILE || './firebase-service-account.json'

let admin = null
let db = null

if (fs.existsSync(KEY_FILE)) {
  try {
    const mod = await import('firebase-admin')
    admin = mod.default || mod
    const serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'))
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    db = admin.firestore()
    console.log('🔥 Firebase connected')
  } catch (e) {
    console.log('⚠️ Firebase key found but could not be used:', e?.message || e)
    db = null
  }
}

if (!db) {
  // Offline stub with the same tiny API the bot uses
  const doc = () => ({
    get: async () => ({ exists: false, data: () => undefined }),
    set: async () => {}, update: async () => {}, delete: async () => {}
  })
  db = {
    collection: () => ({ get: async () => ({ docs: [], empty: true, forEach() {} }), doc }),
    batch: () => ({ set() {}, update() {}, delete() {}, commit: async () => {} })
  }
  console.log('ℹ️ Firebase not configured — using local storage only')
}

export { db }
export default admin
