import { theme } from '../core/theme.js'
// plugins/anti-gcc.js
// Hammam Bot- نظام منع غير المصريين 🇪🇬

let handler = async (m, { conn, text, isAdmin, isOwner }) => {

  // التحقق من المجموعة
  if (!m.isGroup) {
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 هذا الأمر يعمل فقط في المجموعات` }]), m);
  }

  if (!isAdmin && !isOwner) {
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `صلاحيات غير كافية` }, { type: 'divider' }, { type: 'line', text: `🔮 هذا الأمر مخصص للمشرفين فقط` }]), m);
  }

  // التأكد من كتابة التفعيل أو التعطيل
  if (!text) {
    const currentStatus = global.db.data.settings?.[conn.user.jid]?.blockNonEgypt ? '🟢 مُفعل' : '🔴 مُعطل';
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `نظام منع غير المصريين` }, { type: 'divider' }, { type: 'line', text: `🔮 *الحالة:* ${currentStatus}` }, { type: 'line', text: `📌 *الاستخدام:* .منع_الخليج [تفعيل/تعطيل]` }]), m);
  }

  // إنشاء الإعدادات لو غير موجودة
  if (!global.db.data.settings) global.db.data.settings = {};
  if (!global.db.data.settings[conn.user.jid]) {
    global.db.data.settings[conn.user.jid] = { blockNonEgypt: false };
  }

  let setting = global.db.data.settings[conn.user.jid];

  if (text === 'تفعيل') {
    setting.blockNonEgypt = true;
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `✅ تم التفعيل` }, { type: 'divider' }, { type: 'line', text: `🇪🇬 *نظام منع غير المصريين*` }, { type: 'line', text: `🟢 *الحالة:* مُفعلة` }]), m);
  } 
  else if (text === 'تعطيل') {
    setting.blockNonEgypt = false;
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `✅ تم التعطيل` }, { type: 'divider' }, { type: 'line', text: `🔮 *تم إيقاف نظام منع غير المصريين*` }, { type: 'line', text: `🔴 *الحالة:* مُعطلة` }]), m);
  } 
  else {
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 *استخدم:* تفعيل أو تعطيل` }]), m);
  }
};

// ===============================
// 🔥 نظام الطرد التلقائي عند دخول أعضاء جدد
// ===============================

handler.before = async function (m, { conn, isBotAdmin }) {
  
  if (!m.isGroup) return;
  if (!m.message?.groupParticipantAdd) return;
  
  let setting = global.db.data.settings?.[conn.user.jid];
  if (!setting?.blockNonEgypt) return;
  
  if (!isBotAdmin) return;
  
  const groupMetadata = await conn.groupMetadata(m.chat);
  const groupOwner = groupMetadata.owner || m.chat.split('-')[0] + '@s.whatsapp.net';
  const botNumber = conn.user.jid;
  
  const newMembers = m.message.groupParticipantAdd;
  
  let removed = [];
  let removedNames = [];
  
  for (let user of newMembers) {
    if (user === botNumber) continue;
    if (user === groupOwner) continue;
    
    const number = user.split('@')[0];
    
    // السماح للأرقام المصرية فقط (كود مصر 20)
    if (number.startsWith('20')) continue;
    
    try {
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
      removed.push(user);
      try {
        const contact = await conn.getName(user);
        removedNames.push(contact || number);
      } catch {
        removedNames.push(number);
      }
    } catch (err) {
      console.error('[AntiGCC] فشل طرد العضو:', err);
    }
  }
  
  if (removed.length > 0) {
    let membersList = removedNames.join(', ');
    await conn.reply(m.chat, theme.build([{ type: 'title', text: `🚫 تم طرد أعضاء` }, { type: 'divider' }, { type: 'line', text: `🇪🇬 *تم طرد الأعضاء غير المصريين*` }, { type: 'line', text: `👤 *الأعضاء:* ${membersList}` }, { type: 'line', text: `📊 *العدد:* ${removed.length}` }, { type: 'line', text: `🇪🇬 *المجموعة للمصريين فقط*` }]), m);
  }
};

handler.help = ['منع_الخليج <تفعيل/تعطيل>'];
handler.tags = ['group'];
handler.command = /^منع_الخليج$/i;
handler.group = true;
handler.botAdmin = true;
handler.admin = true;

export default handler;