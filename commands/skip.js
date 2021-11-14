const voice = require ('@discordjs/voice');
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
    type: discordjs.Constants.ApplicationCommandOptionTypes.INTEGER
  }]
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

  let reply, currLength;
  //if optional parameter is provided to skip song at position
  if(!!interaction.options.getInteger('queue_position')) {
    const input = interaction.options.getInteger('queue_position');

    //allow usage for /skip -1 to skip last song, but only -1
    if(input < -1) {
      try {
        await interaction.reply({
          content: "```" + `css\n[Invalid input. Only negative allowed is -1]` +"```",
          ephemeral: true
        });
        return;
      }
      catch (err) {
        console.error(err);
      }
    }
    //check if that song exists in queue
    if(server_queue.songs.length-1<input) {
      try {
        await interaction.reply({
          content: "```" + `css\n[No song at position ${input}/${server_queue.songs.length-1}]` +"```",
          ephemeral: true
        });
        return;
      }
      catch (err) {
        console.error(err);
      }
    }

    let song, index;
    if(input === -1) {
      song = server_queue.songs[server_queue.songs.length - 1];
      index = server_queue.songs.length - 1;
    } else {
      song = server_queue.songs[input];
      index = input;
    }
    server_queue = server_queue.songs.splice(input, 1);
    
    currLength = song.length;
    currLength = secondsToTime(currLength);
    reply = "```css\n[Skip song]\n    " + `${index}` + ": " + `${song.title}` + ` [${currLength}]`+ "```";
    await interaction.reply({
      content: reply,
      ephemeral: false
    });
    return
  }

  //console.log(server_queue.player.state.status);
  if(server_queue.player.state.status !== 'idle') {
    server_queue.player.stop();
  }

  const song = server_queue.songs[0];
  currLength = song.length;
  currLength = secondsToTime(currLength);
  reply = "```css\n[Skip song]\n    " + `0` + ": " + `${song.title}` + ` [${currLength}]`+ "```";

  //if loop === true -> turn off on skip (you're trying to skip the song you had looped)
  if(server_queue.loop) {
    server_queue.loop = false;
  }
  
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