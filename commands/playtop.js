const discordjs = require('discord.js');
const getSongs = require('../models/getSongs');
const secondsToTime = require('../models/utils');

command = {
  name: 'playtop',
  description: 'Queue song at the top of the queue',
  options: 
  [{
    name: 'song',
    description: 'Song search term or link',
    required: true,
    type: discordjs.Constants.ApplicationCommandOptionTypes.STRING
  }]
}

async function exec(interaction, server_queue) {

  if(!server_queue) {
    await interaction.reply({
      content: "```css\n[Not playing]   [Use /play instead]\n" + "```",
      ephemeral: false
    });
  }


  input = interaction.options.getString('song');
  let songs;
  const getSongsData = await getSongs(input);
  reply = getSongsData.reply;

  if(getSongsData.songs) {
    songs = getSongsData.songs;
    //if playlist (multiple songs), since we are adding them to position 1 in queue consecutively, reverse the array to add the last one first (LIFO)
    if(songs.length > 1) {
      songs = songs.map(song => song).reverse();

    //manually set reply, as getSongs() assumes there is no queue and therefore the index is 0
    //we need to set the index to 1 
    } else {
      reply = reply = "```css\n[Add song]\n   " + `1` + " : " + `${songs[0].title}` + ` [${secondsToTime(songs[0].length)}]`+ "```";
    }
    
    songs.map(song => {
      server_queue.songs.splice(1, 0, song);
    });
  }


  await interaction.reply({
    content: reply,
    ephemeral: false
  });
}

module.exports = {
  command: command,
  exec: exec
}