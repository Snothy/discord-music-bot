const voice = require ('@discordjs/voice')
const discordjs = require('discord.js');
const fs = require('fs');
const yts = require( 'yt-search' )
const ytdl = require('ytdl-core');
const secondsToTime = require('../models/utils');
const playlist = require('../models/playlist');
const ytdl2 = require('ytdl-core-as');

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
  let song, reply, currLength, songs, playlistData, songData;
  input = interaction.options.getString('song');
  //get song data from input string (whether its a song title or youtube url link)   //if(ytdl.validateURL(input)) { old url validation
  if(input.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi,)) {

    //playlist handler from url
    if(input.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,) && /^.*(youtu.be\/|list=)([^#&?]*).*/gi.test(input)) {
        //console.log('link playlist');
        playlistData = await playlist(input);
        songs = playlistData.songs;
        reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";
      
    //if normal link (one song, not playlist)
    } else if (
      input.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,) && !/^.*(youtu.be\/|list=)([^#&?]*).*/gi.test(input)) {
      //console.log('link video');
      songData = await ytdl.getInfo(input)
      .catch(error => {
        //handle status 410 error (cant access information on video)
        console.log('410');
      });
      if(!songData) {
        await interaction.reply({
          content: "```css\n[Add song failed]\n" + "```",
          ephemeral: true
        });
        return;
      }
      //console.log(songData);
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

    //if the link isnt youtube ot a youtube playlist
    } else {
      await interaction.reply({
        content: "```css\n" + `[Invalid URL]` + "```",
        ephemeral: true
      });
      return
    }

  //if input isnt a url
  } else {
    const searchResult = await yts(input);
    if(searchResult.all.length > 1) {

      //handle playlist
      if(searchResult.all[0].type === 'list') {
        //console.log('normal input playlist');
        const playlistInfo = searchResult.all[0]; //.url .title .videoCount
        playlistData = await playlist(playlistInfo.url);
        songs = playlistData.songs;
        reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";

      //handle normal video search
      } else {
        //console.log('normal video search');
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
      reply = "```css\n[Couldn't connect]\n" + "```";
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

const music_player = async (guild, song, interaction, tries = 0) => {
  const song_queue = interaction.client.queue.get(guild.id);

  if(!song) {
    voice.getVoiceConnection(interaction.guild.id).disconnect();
    interaction.client.queue.delete(guild.id);
    return;
  }
  
  let stream, player, resource
  //load song data
  try {
    await ytdl2(song.url, {filter: "audioonly", highWaterMark: 1 << 28, quality: "highestaudio"})
    .then(istream => {
      stream=istream;
    })
    .catch(e => console.error(e));
    player = voice.createAudioPlayer();
    song_queue.connection.subscribe(player);
    song_queue.player = player;
    resource = voice.createAudioResource(stream);
    await player.play(resource);

    player.on(voice.AudioPlayerStatus.Playing, async () => {
      tries = 0;
    })

    
    player.on(voice.AudioPlayerStatus.Idle, async () => { //or on('finish') or voice.AudioPlayerStatus.Idle
      song_queue.songs.shift();
      await music_player(guild, song_queue.songs[0], interaction);
    })
    

    player.on('error',  async (err) => {
      //if song crashes mid playback (errconn)
      //not sure how to get error codes
      //not sure if this is still an issue when using ytdl2

      //if theres an error while playing the song (err 403), try to play it again (2 attempts 'tries<3')
      if(tries < 3 ) {
        song_queue.songs.unshift(song);
        setTimeout(() => {
          music_player(interaction.guild, song, interaction, tries + 1);
        }, 1000);
      
      //if it doesnt play, skip song
      } else {
        song_queue.songs.shift();
        await music_player(guild, song_queue.songs[0], interaction);
        await interaction.followUp({
          content: "```css\n[Error playing]\n   " + `0` + " : " + `${song.title}` + ` [${secondsToTime(song.length)}]`+ "```",
          ephemeral: true
        });
      }
    })

  //handle ytdl being unable to load video info because of some restrictions - error (410) => skip song 
  } catch(err) {
    song_queue.songs.shift();
    await interaction.followUp({
      content: "```css\n[Error playing]\n   " + `0` + " : " + `${song.title}` + ` [${secondsToTime(song.length)}]`+ "```",
      ephemeral: true
    });
    await music_player(guild, song_queue.songs[0], interaction);
  }

}

module.exports = {
  command: command,
  exec: exec
}