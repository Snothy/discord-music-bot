const voice = require ('@discordjs/voice');
const discordjs = require('discord.js');
const secondsToTime = require('../models/utils');

command = {
  name: 'queue',
  description: 'Show queue',
  options: 
  [{
    name: 'page',
    description: 'Show queue page',
    required: false,
    type: discordjs.Constants.ApplicationCommandOptionTypes.INTEGER
  }]
}

async function exec(interaction, server_queue) {
  if(!voice.getVoiceConnection(interaction.guild.id) || !server_queue) {
    await interaction.reply({
      content: "```css\n" + `[Queue empty]` + "```",
      ephemeral: true
    });
    return
  };

  const input = interaction.options.getInteger('page');
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

  let response, i ,page, maxPages, maxSongs, maxLength, currLength, length;
  response = "";
  i = 0;
  maxLength = 0;
  page = 1;
  length = server_queue.songs.length-1;
  maxPages = Math.floor(length/10)+1;
  server_queue.songs.map(song => {
    maxLength = maxLength + song.length;
  });
  maxLength = new Date(maxLength * 1000).toISOString().substr(11, 8);

  if(!!input) {
    if(input>maxPages) {
      await interaction.reply({
        content: "```css\n" + `[Invalid page ${input}/${maxPages}]` + "```",
        ephemeral: true
      });
      return;
    } else {
      if(input === -1) {
        page = maxPages;
      } else {
        page = input;
      }
      i = page*10-10;
    }
  }

  let loop;
  if(server_queue.loop) {
    loop = 'on';
  } else if (server_queue.loop_queue) {
    loop = 'queue on';
  } else {
    loop = 'off';
  }
  pageResponse = `[Page ${page}/${maxPages}]  [Songs: ${length+1}]  [Length: ${maxLength}]  [Loop ${loop}] \n\n`

  maxSongs = i+10
  for(i ; (i<server_queue.songs.length)&&(i<maxSongs); i++) {
    const position = i.toString();
    if (i===0) {
      response = '   Currently playing: \n'
      response = response + '   ' + position + ' : ' + server_queue.songs[i].title + ` [${secondsToTime(server_queue.songs[i].length)}]` + '\n\n';
    } else {
      response = response + '   ' + position + ' : ' + server_queue.songs[i].title + ` [${secondsToTime(server_queue.songs[i].length)}]` + "\n";
    }
  }

  response = "```css\n" + pageResponse + response +"```";

  try {
    await interaction.reply({
      content: response,
      ephemeral: false
      //embeds: [embed]
    });
  } catch(err) {
    console.error('couldnt send message');
  }

}

module.exports = {
  command: command,
  exec: exec
}