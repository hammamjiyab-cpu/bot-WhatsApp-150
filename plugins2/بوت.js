async function plugin({ send, sender }) {
  await send(
    `@${sender.split('@')[0].split(':')[0]}  شغّال، لا تخاف ياورع  😈⚡`,
    [sender]
  )
}

plugin.command = /^\.بوت$/
plugin.help = '.بوت'
plugin.access = 'elite'
plugin.priority = 5

export default plugin