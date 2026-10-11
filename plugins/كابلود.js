// plugins/kablod.js
// Hammam Bot— كابلود 🤖

import WebSocket from 'ws';
import axios from 'axios';
import { theme } from '../core/theme.js'

class Copilot {
    constructor() {
        this.conversationId = null
        this.headers = {
            origin: 'https://copilot.microsoft.com',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    }

    async createConversation() {
        let { data } = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, { headers: this.headers })
        this.conversationId = data.id
        return this.conversationId
    }

    async chat(message) {
        if (!this.conversationId) await this.createConversation()
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1`, { headers: this.headers })
            let response = ''
            
            const timeout = setTimeout(() => {
                ws.terminate()
                reject(new Error('الوقت انتهى، حاول مرة أخرى'))
            }, 60000)

            ws.on('open', () => {
                ws.send(JSON.stringify({
                    event: 'send',
                    mode: 'chat',
                    conversationId: this.conversationId,
                    content: [{ type: 'text', text: message }],
                    context: {}
                }))
            })

            ws.on('message', chunk => {
                try {
                    const parsed = JSON.parse(chunk.toString())
                    if (parsed.event === 'appendText') response += parsed.text || ''
                    if (parsed.event === 'done') {
                        clearTimeout(timeout)
                        resolve(response)
                        ws.close()
                    }
                } catch (e) {}
            })

            ws.on('error', (err) => {
                clearTimeout(timeout)
                reject(err)
            })
        })
    }
}

let handler = async (m, { conn, text }) => {
    try {
        if (!text) {
            return m.reply(theme.build([{ type: 'title', text: `وحدة كابلود` }, { type: 'divider' }, { type: 'line', text: `🤖 *الاستخدام:* .كابلود <سؤالك>` }, { type: 'line', text: `📌 *مثال:* .كابلود من أنت؟` }]));
        }

        await conn.sendMessage(m.chat, { react: { text: '🧠', key: m.key } });
        await m.reply(theme.build([{ type: 'title', text: `🧠 كابلود يفكر...` }]));

        let copilot = new Copilot();
        let res = await copilot.chat(text);

        if (!res || res.trim() === '') {
            throw new Error('لم يتم الحصول على رد');
        }

        let cleanResponse = res.trim();

        await conn.sendMessage(m.chat, {
            text: theme.build([{ type: 'title', text: `رد كابلود` }, { type: 'divider' }, { type: 'line', text: `💬 *سؤالك:* ${text}` }, { type: 'line', text: `📝 *الرد:*` }, { type: 'line', text: `${cleanResponse}` }])
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error('[Kablod]', e);
        await m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🤖 ${e.message || 'حدث خطأ في كابلود'}` }, { type: 'line', text: `🔮 حاول مرة أخرى لاحقاً` }]));
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}

handler.help = ['كابلود <سؤال>'];
handler.command = ['كابلود', 'kablod'];
handler.tags = ['ai'];

export default handler;