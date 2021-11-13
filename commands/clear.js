const voice = require ('@discordjs/voice')

command = {
  name: 'clear',
  aliases: ["leave", "c"],
  description: 'Clear queue & voice channel'
}

async function exec(interaction, server_queue) {
  if(!voice.getVoiceConnection(interaction.guild.id) || !server_queue) {
    await interaction.reply({
      content: "```css\n" + `[There is no queue.]` + "```",
      ephemeral: true
    });
    return
  };

  let reply;
  // if queue => clear queue & stop song
  if(server_queue) {
    interaction.client.queue.delete(interaction.guildId);
    server_queue.player.stop();
    reply = "```css\n[Clear queue]\n" + "```";
  } else {
    reply = "```css\n[Leave voice chat]\n" + "```";
  }
  // leave
  voice.getVoiceConnection(interaction.guild.id).disconnect();

  try {
    await interaction.reply({
      content: reply,
      ephemeral: false
    });
  }catch(err) {
    console.error('couldnt send message');
  }

}

module.exports = {
  command: command,
  exec: exec
} 