const voice = require ('@discordjs/voice')

command = {
  name: 'join',
  description: 'Join voice channel'
}

async function exec(interaction) {
  const user = await interaction.member.fetch();

  //Check if user is in a voice channel
  const vc = await user.voice.channel;
  if(!vc) {
    await interaction.reply({
      content: 'You need to be in a voice channel to use this command',
      ephemeral: true
    })
    return;
  }

  voice.joinVoiceChannel({
    channelId: vc.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  })


  await interaction.reply({
    content: `i am join`,
    ephemeral: true
  });
}

module.exports = {
  command: command,
  exec: exec
}