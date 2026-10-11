/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

let handler = async (m, { conn }) => {
  if (!m.quoted) {
    return conn.reply(
      m.chat,
      `> ＃ Hammam 〢 𝙸𝙼𝙰𝙶𝙴
>
> 🖼️ قم بالرد على ملصق
> لتحويله إلى صورة.
>
> Hammam`,
      m
    )
  }

  try {
    await m.react('🕒')

    let imgBuffer = await m.quoted.download()

    if (!imgBuffer) {
      await m.react('✖️')

      return conn.reply(
        m.chat,
        `> ＃ Hammam 〢 𝙴𝚁𝚁𝙾𝚁
>
> ⚠️ تعذّر قراءة الملصق.
> جرّب ملصقاً آخر.
>
> Hammam`,
        m
      )
    }

    await conn.sendMessage(
      m.chat,
      {
        image: imgBuffer,
        caption: `> ＃ Hammam 〢 𝙸𝙼𝙰𝙶𝙴
>
> ✦ تم تحويل الملصق
> إلى صورة بنجاح.
>
> 🖼️ 𝙵𝙾𝚁𝙼𝙰𝚃 : 𝙹𝙿𝙶
>
> Hammam`
      },
      { quoted: m }
    )

    await m.react('✔️')

  } catch (e) {
    await m.react('✖️')

    await conn.reply(
      m.chat,
      `> ＃ Hammam 〢 𝙴𝚁𝚁𝙾𝚁
>
> ⚠️ حدث خطأ أثناء التحويل.
> حاول مرة أخرى لاحقاً.
>
> Hammam`,
      m
    )

    console.error(e)
  }
}

handler.help = ['لصورة']
handler.tags = ['tools']
handler.command = ['لصورة', 'jpg']

export default handler