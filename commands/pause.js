const voice = require ('@discordjs/voice');
const secondsToTime = require('../models/utils');

command = {
  name: 'pause',
  description: 'Pause current song'
}

async function exec(interaction, server_queue) {
  //interaction.client.queue[interaction.guildId].connection.dispatcher.end();
  //console.log(server_queue.connection.state.subscription.player.stop());
  //voice.getVoiceConnection(interaction.guild.id).dispatchAudio();
  server_queue.player.pause();

  let currLength, reply;
  const song = server_queue.songs[0];
  currLength = song.length;
  currLength = secondsToTime(currLength);
  reply = "```css\n[Pause song]\n    " + `0` + ": " + `${song.title}` + ` [${currLength}]`+ "```";

  await interaction.reply({
    content: reply,
    ephemeral: true
  });
}

module.exports = {
  command: command,
  exec: exec
}