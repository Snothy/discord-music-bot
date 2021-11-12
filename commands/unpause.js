const voice = require ('@discordjs/voice');
const secondsToTime = require('../models/utils');

command = {
  name: 'unpause',
  description: 'Unpause current song'
}

async function exec(interaction, server_queue) {
  let currLength, reply;
  //check if bot is in vc
  if(!voice.getVoiceConnection(interaction.guild.id)) {
    await interaction.reply({
      content: "```css\n" + `[Not in voice chat]` + "```",
      ephemeral: true
    });
    return
  }
  //check if queue is empty
  if(!server_queue) {
    await interaction.reply({
      content: "```css\n" + `[Queue empty]` + "```",
      ephemeral: true
    });
    return
  }

  //if player is paused
  if(server_queue.player.state.status === 'paused') {
    server_queue.player.unpause();
    const song = server_queue.songs[0];
    currLength = song.length;
    currLength = secondsToTime(currLength);
    reply = "```css\n[Unpause song]\n    " + `0` + ": " + `${song.title}` + ` [${currLength}]`+ "```";
  
  //if player is playing
  } else if (server_queue.player.state.status === 'playing') {
    reply = "```css\n" + `[Already playing]` + "```";

  //if status is something other than paused or playing (such as idle)
  } else {
    reply = "```css\n" + `[Could not unpause]` + "```";
  }



  await interaction.reply({
    content: reply,
    ephemeral: true
  });
}

module.exports = {
  command: command,
  exec: exec
}