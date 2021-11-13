const voice = require ('@discordjs/voice');

command = {
  name: 'loop',
  description: 'Loop current song'
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

  server_queue.loop = !server_queue.loop;
  server_queue.loop_queue = false;

  const reply = "```css\n"+ `[Loop ${server_queue.loop ? 'on' : 'off'}]` +"\n```";
  try {
    await interaction.reply({
      content: reply,
      ephemeral: false
    });
  } catch(err) {
    console.log('couldnt send message');
  }

}

module.exports = {
  command: command,
  exec: exec
}