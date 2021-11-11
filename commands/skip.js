const voice = require ('@discordjs/voice')
const discordjs = require('discord.js');
const secondsToTime = require('../models/utils');

command = {
  name: 'skip',
  description: 'Skip current song',
  options: 
  [{
    name: 'queue_position',
    description: 'Skip song at certain position in queue',
    required: false,
    type: discordjs.Constants.ApplicationCommandOptionTypes.NUMBER
  }]
}

async function exec(interaction, server_queue) {
  //if not in voice chat or no server queue (no player to perform methods on)
  if(!voice.getVoiceConnection(interaction.guild.id) || !server_queue) {
    await interaction.reply({
      content: `Could not skip.`,
      ephemeral: true
    });
    return
  };

  let reply, currLength;
  //if optional parameter is provided to skip song at position
  if(!!interaction.options.getNumber('queue_position')) {
    const input = interaction.options.getNumber('queue_position');
    console.log(input);
    //check if that song exists in queue
    if(server_queue.songs.length<input) {
      await interaction.reply({
        content: `Queue only contains ${server_queue.songs.length} songs. Cannot skip position ${input}`,
        ephemeral: true
      });
      return;
    }
    const song = server_queue.songs[input];
    server_queue = server_queue.songs.splice(input, 1);
    
    currLength = song.length;
    currLength = secondsToTime(currLength);
    reply = "```css\n[Skip song]\n    " + `${input}` + ": " + `${song.title}` + ` [${currLength}]`+ "```";
    await interaction.reply({
      content: reply,
      ephemeral: false
    });
    return
  }

  const song = server_queue.songs[0];
  currLength = song.length;
  currLength = secondsToTime(currLength);
  reply = "```css\n[Skip song]\n    " + `0` + ": " + `${song.title}` + ` [${currLength}]`+ "```";

  server_queue.player.stop();
  await interaction.reply({
    content: reply,
    ephemeral: false
  });
}

module.exports = {
  command: command,
  exec: exec
}