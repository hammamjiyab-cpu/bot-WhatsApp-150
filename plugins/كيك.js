// plugins/kick-alias.js
// ✦ اسم بديل لأمر الطرد (نفس منطق طرد.js حتى لا يتكرر الرد)

import base from './طرد.js'

function handler(...args) { return base.apply(this, args) }
handler.help = ['اخراج @user']
handler.tags = ['group']
handler.command = ['اخراج', 'ازالة']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
