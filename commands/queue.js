const voice = require ('@discordjs/voice');
const discordjs = require('discord.js');

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
  let response, i ,page, maxPages, maxSongs, maxLength, currLength;
  response = "";
  i = 0;
  maxLength = 0;
  page = 1;
  const length = server_queue.songs.length-1;
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
      page = input;
      i = page*10-10;
    }
  }

  pageResponse = `[Page ${page}/${maxPages}]  [Songs: ${length+1}]  [Length: ${maxLength}] \n\n`

  maxSongs = i+10
  for(i ; (i<server_queue.songs.length)&&(i<maxSongs); i++) {
    currLength = server_queue.songs[i].length;
    if(currLength>3600) {
      currLength = new Date(currLength * 1000).toISOString().substr(11, 8);
    } else {
      currLength = new Date(currLength * 1000).toISOString().substr(14, 5)
    }
    
    const position = i.toString();
    if (i===0) {
      response = '   Currently playing: \n'
      response = response + '   ' + position + ' : ' + server_queue.songs[i].title + ` [${currLength}]` + '\n\n';
    } else {
      response = response + '   ' + position + ' : ' + server_queue.songs[i].title + ` [${currLength}]` + "\n";
    }
  }
  response = "```css\n" + pageResponse + response +"```";

  await interaction.reply({
    content: response,
    ephemeral: false
    //embeds: [embed]
  });
}

module.exports = {
  command: command,
  exec: exec
}