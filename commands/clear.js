const voice = require ('@discordjs/voice')

command = {
  name: 'clear',
  aliases: ["leave", "c"],
  description: 'Clear queue & voice channel'
}

async function exec(interaction, server_queue) {
  // clear queue
  interaction.client.queue.delete(interaction.guildId);
  // stop song
  server_queue.player.stop();
  // leave
  voice.getVoiceConnection(interaction.guild.id).disconnect();

  const reply = "```css\n[Clear queue]\n" + "```";
  await interaction.reply({
    content: reply,
    ephemeral: false
  });
}

module.exports = {
  command: command,
  exec: exec
} 