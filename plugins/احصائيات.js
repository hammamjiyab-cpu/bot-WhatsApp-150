/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import fs from 'fs'
import path from 'path'
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const DEV_NAME = 'Hammam'
const DEV_NUMBER = ('+'+String(global.owner?.[0] || ''))

// همسات عشوائية تتغير في كل استدعاء
const WHISPERS = [
    'لا تلتفت خلفك... إنه يقرأ رسائلك 👁️',
    'كل أمر تكتبه يوقظ روحًا نائمة 🕯️',
    'الظلام لا ينام... وأنا كذلك 🖤',
    'سمعتُ خطواتك قبل أن تكتب 🩸',
    'بعضُ الأوامر لا تُرَدّ إلا بثمن ⛓️',
    'ما زلتُ هنا... ولن أرحل ☠️',
    'الأرواح المحبوسة تنتظر أمرك القادم 🕸️'
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

let handler = async (m, { conn }) => {
    await m.react('☠️')

    // عدد الأرواح المحبوسة = عدد ملفات الأوامر
    let pluginsDir = path.join(process.cwd(), 'plugins')
    let totalCommands = 0
    try {
        if (fs.existsSync(pluginsDir)) {
            totalCommands = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js')).length
        }
    } catch (e) {
        totalCommands = 158
    }

    // نبض البوت = وقت التشغيل
    let uptimeMs = process.uptime() * 1000
    let hours = Math.floor(uptimeMs / (1000 * 60 * 60))
    let minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
    let seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000)
    let uptimeString = `${hours} ساعة ⋆ ${minutes} دقيقة ⋆ ${seconds} ثانية`

    // ذاكرة الظلام = استهلاك الرام
    let ramMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)

    let submessages = [
        {
            messageType: 2,
            messageText:
`╔══════ ☠️ ══════╗
    𝕬𝕶𝕬𝕿𝕾𝖀 ⛧ 𝕭𝖔𝖙
╚══════ ☠️ ══════╝

🕯️ ﴿ لقد استيقظ من رقاده ﴾ 🕯️
🩸 ـ𝕱𝖎𝖑𝖊 ـ ملف الأرواح الملعونة ـ 🩸`
        },

        {
            messageType: 4,

            tableMetadata: {
                rows: [
                    {
                        items: ['💀 الكيان', '𝕬𝕶𝕬𝕿𝕾𝖀'],
                        isHeading: false
                    },
                    {
                        items: ['🩸 نبضه ما زال حيًّا', uptimeString],
                        isHeading: false
                    },
                    {
                        items: ['⛓️ الأرواح المحبوسة', `${totalCommands} روح`],
                        isHeading: false
                    },
                    {
                        items: ['🕸️ ذاكرة الظلام', `${ramMB} MB`],
                        isHeading: false
                    },
                    {
                        items: ['⚰️ سيّد اللعنة', DEV_NAME],
                        isHeading: false
                    },
                    {
                        items: ['🔮 حبل الاستدعاء', DEV_NUMBER],
                        isHeading: false
                    }
                ],

                title: '☠ 𝕬𝕶𝕬𝕿𝕾𝖀 ⛧ 𝕮𝖀𝕽𝕾𝕰𝕯 ⛧ 𝕱𝕴𝕷𝕰 ☠'
            }
        },

        {
            messageType: 2,
            messageText:
`⛧ ─── 🩸 ─── ⛧
${pick(WHISPERS)}
⛧ ─── 🩸 ─── ⛧

🖤 ـ ${DEV_NAME} ـ 🖤`
        }
    ]

    let richMsg = generateWAMessageFromContent(
        m.chat,
        {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: submessages,

                        contextInfo: {
                            forwardingSlib: 99999,
                            isForwarded: true,

                            forwardedAiBotMessageInfo: {
                                botJid: conn.user.id.split(':')[0] + '@bot'
                            },

                            forwardOrigin: 4
                        }
                    }
                }
            }
        },
        {}
    )

    await conn.relayMessage(
        m.chat,
        richMsg.message,
        {
            messageId: richMsg.key.id,

            additionalNodes: [
                {
                    tag: 'biz',
                    attrs: {},

                    content: [
                        {
                            tag: 'interactive',

                            attrs: {
                                type: 'native_flow',
                                v: '1'
                            },

                            content: [
                                {
                                    tag: 'native_flow',

                                    attrs: {
                                        v: '9',
                                        name: 'mixed'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    )
}

handler.help = [
    'stats',
    'البوت'
]

handler.tags = ['main']

handler.command =
    /^(stats|الاحصائيات|إحصائيات|البوت)$/i

export default handler
