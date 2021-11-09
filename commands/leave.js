const voice = require ('@discordjs/voice')

command = {
  name: 'leave',
  description: 'Leave voice channel'
}

async function exec(interaction) {
  voice.getVoiceConnection(interaction.guild.id).disconnect();


  await interaction.reply({
    content: `Bye bye pisslow`,
    ephemeral: true
  });
}

module.exports = {
  command: command,
  exec: exec
} 