// plugins/fzora.js
// ⧼ 𝑷𝑹𝑶𝑻𝑶𝑻𝒀𝑷𝑬 ⧽v2 - لعبة الفوازير 🧩

import { generateWAMessageFromContent, proto } from "@whiskeysockets/baileys";
import { theme } from '../core/theme.js';

let handler = async (m, { conn, usedPrefix }) => {

    let question = pickRandom(global.wisuiska);

    const interactiveMessage = {
        body: proto.Message.InteractiveMessage.Body.create({
            text: theme.build([
                { type: 'title', text: '🧩 لعبة الفوازير' },
                { type: 'spacer' },
                { type: 'info', label: '❓ اللغز', value: question },
                { type: 'divider' },
                { type: 'line', text: '💡 اضغط على زر لغز آخر لتحدي جديد' }
            ])
        }),
        footer: proto.Message.InteractiveMessage.Footer.create({
            text: '⧼ 𝑷𝑹𝑶𝑻𝑶𝑻𝒀𝑷𝑬 ⧽ v2 🧩'
        }),
        header: proto.Message.InteractiveMessage.Header.create({
            hasMediaAttachment: false
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [{
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🧩 لـغـز آخـر",
                    id: `${usedPrefix}فزوره`
                })
            }]
        })
    };

    let msg = generateWAMessageFromContent(
        m.chat,
        {
            viewOnceMessage: {
                message: { interactiveMessage }
            }
        },
        { userJid: conn.user.id, quoted: m }
    );

    await conn.sendMessage(m.chat, { react: { text: '🧩', key: m.key } });
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.help = ["فزوره"];
handler.tags = ["fun"];
handler.command = /^(فزوره|فزورة|لغز)$/i;

export default handler;

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

global.wisuiska = [
    "ايه الحاجه اللي لازم تكسرها قبل ما تستخدها؟",
    "ما هو الحيوان الذي لا يبيض ولا يلد؟",
    "عقرب لا يخاف منه احد وغير مؤذي؟",
    "من هو الانسان الذي قتل ربع سكان العالم؟",
    "ما هو الشي الذي ترميه قبل ان تستخدمه؟",
    "تأكل ولا تشبع ما هي؟",
    "الماء ابوه ولكن اذا وضعناه مع الماء يموت؟",
    "ماهو الشيء الذي كلما اخذت منه كبر؟",
    "اخت خالك ومش خالتك مين هي؟",
    "شئ امامك ولن تراه؟",
    "من هو الخال الوحيد لأولاد عمتك؟",
    "ما هو الشيء الذي يقرصك دون ان تراه؟",
    "شئ يخترق الزجاج ولا يكسره؟",
    "ما هي الصلاة التي لا نسجد ولا نركع فيها؟",
    "شئ لو وضعته في الثلاجه لا يبرد؟",
    "ما هي السورة التي بدأت وانتهت بالتسبيح؟",
    "ما هي السور التي تسمى بمواقيت الصلاة؟",
    "كم عدد كلمات آية الكرسي؟",
    "ما هي السورة الملقبة بقلب القرآن؟",
    "ماهو الشيء الذي له أربع أرجل ولا يمشي ؟",
    "ايهما اثقل كيلو اسفنج ام كيلو من حديد ؟",
    "شىء اخف من الريش ومع ذلك لايمكن الامساك به طويلا؟",
    "ماهو الشىء الذى ليس بإنسان ولا حيوان ولا جماد؟",
    "ما هو الشّيء الّذي يَكتُب ولا يقرأ؟",
    "ما هو الشّيء الّذي إذا لمسته أصدر صوتاً؟",
    "ما هو الشيء الّذي لا يؤكل في الليل أبداً؟",
    "شيء يتحدث ويتكلم بدون لسان ولا أذنين؟",
    "ما هو الشيء الّذي ليس له بداية ولا نهاية؟",
    "فاكهة لونها مثل اسمها؟",
    "شيء ينبض دون أن يكون له قلب فما هو؟",
    "أين يوجد البحر الذي لا يوجد به ماء؟",
    "يسير على الماء ولكنه لا يبتل.. فما هو؟",
    "ما هو الشيء الذي كلما تحرك خسر جزءًا من ذيله؟",
    "ما هو الشيء الذي له رأس ولكن ليس له عين؟",
    "ما هو الشيء الذي يوجد في السماء وإذا أضفنا إليه حرفا أصبح شيء يوجد في الأرض؟",
    "ماهو الشيء الذي لا تحب ان تلبسه وإذا لبسته لا تراه ؟",
    "ما هو الشيء عندما يكون لونه اسود لا يكون نافع ولكن عندما يكون لونه احمر يكون نافع؟",
    "من هو الشخص الذي يكون ابن أمك وأبيك ولكن ليس أخيك؟",
    "من هو الذي مات ولم يولد؟",
    "ما هو الشيء الذي إن غليـته جمد؟",
    "ماهو الشيء الذي تأكل منه مع إنه لا يؤكل؟",
    "ماهو الشيء الذي كلما زاد نقص؟"
];