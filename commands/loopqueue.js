const voice = require ('@discordjs/voice');

command = {
  name: 'loopqueue',
  description: 'Loop entire queue'
}

async function exec(interaction, server_queue) {
  //if not in voice chat or no server queue (no player to perform methods on)
  if(!voice.getVoiceConnection(interaction.guild.id) || !server_queue) {
    await interaction.reply({
      content: "```" + `css\n[Not playing]` +"```",
      ephemeral: true
    });
    return
  };

  server_queue.loop_queue = !server_queue.loop_queue;
  server_queue.loop = false;

  const reply = "```css\n"+ `[Loop queue ${server_queue.loop_queue ? 'on' : 'off'}]` +"\n```";

  try {
    await interaction.reply({
      content: reply,
      ephemeral: false
    });
  } catch(err) {
    console.error('couldnt send message');
  }

}

module.exports = {
  command: command,
  exec: exec
}