const voice = require ('@discordjs/voice')
const discordjs = require('discord.js');
const fs = require('fs');
const yts = require( 'yt-search' )
const ytdl = require('ytdl-core');
const secondsToTime = require('../models/utils');
const playlist = require('../models/playlist');

command = {
  name: 'play',
  aliases: ['p'],
  description: 'Play a song',
  options: 
  [{
    name: 'song',
    description: 'The name of the song',
    required: true,
    type: discordjs.Constants.ApplicationCommandOptionTypes.STRING
  }]
}

async function exec(interaction, server_queue) {
  const user = await interaction.member.fetch();

  //Check if user is in a voice channel
  const vc = await user.voice.channel;
  if(!vc) {
    await interaction.reply({
      content: "```css\n[You need to be in a voice channel to use this command]\n" + "```",
      ephemeral: true
    })
    return;
  }

  //let server_queue = interaction.client.queue.get(interaction.guildId);
  let song, reply, currLength, songs, playlistData
  const input = interaction.options.getString('song');

  //get song data from input string (whether its a song title or youtube url link)
  if(ytdl.validateURL(input)) {

    //playlist handler from url
    if(input.match(
        /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,
      ) &&
      /^.*(youtu.be\/|list=)([^#&?]*).*/gi.test(input)) {
        playlistData = await playlist(input);
        songs = playlistData.songs;
        reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";
      
    //if normal link (one song, not playlist)
    } else {
      const songData = await ytdl.getInfo(input);
      //console.log(songData);
      console.log(Object.keys(songData));
      console.log(songData.videos);
      //this could lead to a playlist, rather than a single url
      song = {
        title: songData.videoDetails.title,
        url: songData.videoDetails.video_url,
        length: songData.videoDetails.lengthSeconds
      }
      //reply = 'Playing ' + song.title;
      currLength = song.length;
      currLength = secondsToTime(currLength);
      reply = "```css\n[Add song]\n   0 : " + `${song.title}` + ` [${currLength}]`+ "```";
    }

  //if input isnt a url
  } else {
    const searchResult = await yts(input);
    if(searchResult.all.length > 1) {

      //handle playlist
      if(searchResult.all[0].type === 'list') {
        const playlistInfo = searchResult.all[0]; //.url .title .videoCount
        playlistData = await playlist(playlistInfo.url);
        songs = playlistData.songs;
        reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";

      //handle normal video search
      } else {
        song = {
          title: searchResult.all[0].title,
          url: searchResult.all[0].url,
          length: searchResult.all[0].duration.seconds
        }
        currLength = song.length;
        currLength = secondsToTime(currLength);
        reply = "```css\n[Add song]\n   0 : " + `${song.title}` + ` [${currLength}]`+ "```";
      }

    } else {
      reply = "```css\n[Add song failed]\n" + "```"
    }
  }

  if(!server_queue) {
    const queue_constructor = {
      voice_channel: vc,
      text_channel: interaction.channel,
      connection: null,
      player: null,
      songs: []
    }
    interaction.client.queue.set(interaction.guildId, queue_constructor);


    //if normal song
    if(!songs) {
      queue_constructor.songs.push(song);

    //if playlist
    } else {
      songs.map(song => {
        queue_constructor.songs.push(song);
      })
    }
    
    try {
      const connection = voice.joinVoiceChannel({
        channelId: vc.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      queue_constructor.connection = connection;
      await music_player(interaction.guild, queue_constructor.songs[0], interaction);
    } catch(err) {
      interaction.client.queue.delete(interaction.guildId);
      reply = 'Could not connect to voice channel';
      console.error(err);
    }

  //if a server queue DOES exist
  } else {
    //if normal song
    if(!songs) {
      server_queue.songs.push(song);
      currLength = song.length;
      currLength = secondsToTime(currLength);
      reply = "```css\n[Add song]\n   " + `${server_queue.songs.length-1}` + " : " + `${song.title}` + ` [${currLength}]`+ "```";

    //if playlist
    } else {
      songs.map(song => {
        server_queue.songs.push(song);
      });
      reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";
    }



  }

  await interaction.reply({
    content: reply,
    ephemeral: false
  });
}

const music_player = async (guild, song, interaction) => {
  const song_queue = interaction.client.queue.get(guild.id);

  if(!song) {
    voice.getVoiceConnection(interaction.guild.id).disconnect();
    interaction.client.queue.delete(guild.id);
    return;
  }

  const stream = ytdl(song.url, {filter: 'audioonly', type: 'opus'});
  const player = voice.createAudioPlayer();
  song_queue.connection.subscribe(player);
  song_queue.player = player;
  const resource = voice.createAudioResource(stream);
  await player.play(resource);

  player.on('error', err => {
    console.error(err);
  })

  /*
  audioPlayer.on(voice.AudioPlayerStatus.Playing, async () => {
    //perform some action while playing
  });
  */

  player.on(voice.AudioPlayerStatus.Idle, async () => {
    const timeout = async (ms) => {
      setTimeout(ms);
    }
    await timeout(2000);
    if(voice.AudioPlayerStatus.Buffering || voice.AudioPlayerStatus.Playing) {
      return;
    }

    song_queue.songs.shift();
    await music_player(guild, song_queue.songs[0], interaction);
    
    /*
    //edit reply rather than send reply
    await interaction.editReply({
      content: `Playing ${song.title}`,
      ephemeral: false
    });
    */
    
  })
  
}

module.exports = {
  command: command,
  exec: exec
}