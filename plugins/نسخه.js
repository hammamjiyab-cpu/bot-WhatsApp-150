// plugins/getbot.js
// Hammam Bot- نسخه احتياطيه للبوت 📦

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; 
import { dirname } from 'path';
import archiver from 'archiver';
import { theme } from '../core/theme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const handler = async (m, { conn, isOwner }) => {
    if (!isOwner) {
        await conn.sendMessage(m.chat, { 
            text: theme.build([
                { type: 'title', text: '🔒 صـلاحـيـة مـرفـوضـة' },
                { type: 'subtitle', text: '❄️ هذا الأمر للمطور الحقيقي فقط' }
            ])
        }, { quoted: m });
        return;
    }

    try {
        const botFolderPath = path.join(__dirname, '../');
        const zipFilePath = path.join(__dirname, '../bot_files.zip');

        // التحقق من وجود المجلد
        if (!fs.existsSync(botFolderPath)) {
            await conn.sendMessage(m.chat, { 
                text: theme.build([
                    { type: 'title', text: '❌ خـطـأ' },
                    { type: 'error', text: 'مجلد البوت غير موجود' },
                    { type: 'divider' },
                    { type: 'info', label: 'المسار', value: botFolderPath }
                ])
            }, { quoted: m });
            return;
        }

        let initialMessage = await conn.sendMessage(m.chat, { 
            text: theme.build([
                { type: 'title', text: '📦 نـسـخـة احـتـيـاطـيـة' },
                { type: 'divider' },
                { type: 'line', text: '📂 جاري قراءة ملفات البوت...' }
            ])
        }, { quoted: m });

        // حذف ملف ZIP قديم لو موجود
        if (fs.existsSync(zipFilePath)) {
            try { fs.unlinkSync(zipFilePath); } catch {}
        }

        let zippingMessage = await conn.sendMessage(m.chat, { 
            text: theme.build([
                { type: 'title', text: '🔄 جـاري الـضـغـط' },
                { type: 'divider' },
                { type: 'line', text: '⏳ يتم الآن إنشاء ملف ZIP...' }
            ]),
            edit: initialMessage.key 
        }, { quoted: m });

        // إنشاء ملف ZIP باستخدام archiver
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                resolve(sizeMB);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // إضافة كل الملفات والمجلدات مع استثناءات
            archive.glob('**/*', {
                cwd: botFolderPath,
                ignore: [
                    'node_modules/**',
                    '.npm/**',
                    'JadiBots/**',
                    'GataJadiBot/**',
                    'tmp/**',
                    '*.zip',
                    '.git/**',
                    'auth_info_baileys/**',
                    'session/**'
                ]
            });

            archive.finalize();
        }).then(async (sizeMB) => {
            // نجاح الضغط
            let sendingMessage = await conn.sendMessage(m.chat, { 
                text: theme.build([
                    { type: 'title', text: '📤 جـاري الإرسـال' },
                    { type: 'success', text: 'تم إنشاء ملف ZIP بنجاح' },
                    { type: 'info', label: '📁 الحجم', value: `${sizeMB} MB` },
                    { type: 'divider' },
                    { type: 'line', text: '⏳ يتم الآن إرسال الملف...' }
                ]),
                edit: zippingMessage.key 
            }, { quoted: m });

            try {
                await conn.sendMessage(m.chat, {
                    document: fs.readFileSync(zipFilePath),
                    mimetype: 'application/zip',
                    fileName: 'Hammam Bot.zip'
                }, { quoted: m });

                // حذف الملف بعد الإرسال
                fs.unlink(zipFilePath, async (err) => {
                    if (!err) {
                        await conn.sendMessage(m.chat, { 
                            text: theme.build([
                                { type: 'title', text: '✅ تـم بـنـجـاح' },
                                { type: 'success', text: 'تم إرسال النسخة الاحتياطية وحذف الملف المؤقت' }
                            ]),
                            edit: sendingMessage.key 
                        }, { quoted: m });
                    }
                });
            } catch (sendErr) {
                await conn.sendMessage(m.chat, { 
                    text: theme.build([
                        { type: 'title', text: '❌ فـشـل الإرسـال' },
                        { type: 'error', text: sendErr.message },
                        { type: 'divider' },
                        { type: 'info', label: '💡 الحل', value: 'الملف كبير جداً' }
                    ]),
                    edit: sendingMessage.key 
                }, { quoted: m });
                
                try { fs.unlinkSync(zipFilePath); } catch {}
            }
        }).catch(async (err) => {
            // فشل الضغط
            console.error('Archiver Error:', err);
            await conn.sendMessage(m.chat, { 
                text: theme.build([
                    { type: 'title', text: '❌ فـشـل الـضـغـط' },
                    { type: 'error', text: err.message }
                ]),
                edit: zippingMessage.key 
            }, { quoted: m });
        });

    } catch (err) {
        console.error('General Error:', err);
        await conn.sendMessage(m.chat, { 
            text: theme.build([
                { type: 'title', text: '❌ خـطـأ غـيـر مـتـوقـع' },
                { type: 'error', text: err.message }
            ])
        }, { quoted: m });
    }
};

handler.help = ['سكربتي'];
handler.tags = ['owner'];
handler.command = /^(سكربتي|getbot|نسخه)$/i;
handler.owner = true;

export default handler;