const voice = require ('@discordjs/voice')
const discordjs = require('discord.js');
//const fs = require('fs');
//const yts = require( 'yt-search' )
//const ytdl = require('ytdl-core');
const secondsToTime = require('../models/utils');
//const playlist = require('../models/playlist');
const getSongs = require('../models/getSongs');
const ytdl2 = require('ytdl-core-as');

command = {
  name: 'play',
  aliases: ['p'],
  description: 'Play or queue a song',
  options: 
  [{
    name: 'song',
    description: 'Song search term or link',
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

  let reply, songs;
  input = interaction.options.getString('song');
  const getSongsData = await getSongs(input);
  reply = getSongsData.reply;
  

  if(!server_queue && getSongsData.songs) {
    const queue_constructor = {
      voice_channel: vc,
      text_channel: interaction.channel,
      connection: null,
      player: null,
      songs: [],
      loop: false,
      loop_queue: false,
      loop_queue_songs: []
    }
    interaction.client.queue.set(interaction.guildId, queue_constructor);

    songs = getSongsData.songs;
    songs.map(song => {
      queue_constructor.songs.push(song);
    });
    
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
  } else if (getSongsData.songs) {
    songs = getSongsData.songs;
    //if normal song
    if(songs.length === 1) {
      server_queue.songs.push(songs[0]);
      currLength = songs[0].length;
      currLength = secondsToTime(currLength);
      reply = "```css\n[Add song]\n   " + `${server_queue.songs.length-1}` + " : " + `${songs[0].title}` + ` [${currLength}]`+ "```";

    //if playlist
    } else {
      songs.map(song => {
        server_queue.songs.push(song);
      });
      //const playlistData = getSongsData.playlistData;
      //reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";
    }
  }

  try {
    await interaction.reply({
      content: reply,
      ephemeral: false
    });
  } catch(err) {
    console.log('Failed posting message');
    console.error(err);
  }

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

    //if bot is disconnected from vc => clear queue
    song_queue.connection.on(voice.VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        //if switching channels (or dragged into a different channel), give 5 seconds to reconnect
        await Promise.race([
          voice.entersState(song_queue.connection, voice.VoiceConnectionStatus.Signalling, 1_000),
          voice.entersState(song_queue.connection, voice.VoiceConnectionStatus.Connecting, 1_000)
        ]);
      } catch(err) {
        interaction.client.queue.delete(interaction.guildId);
      }
    });

    player.on(voice.AudioPlayerStatus.Playing, async () => {
      tries = 0;
    });
    
    player.on(voice.AudioPlayerStatus.Idle, async () => { //or on('finish') or voice.AudioPlayerStatus.Idle
      //no error on downloading audio
      if(stream._readableState.errored == null) {
        //handle loops
        if(song_queue.loop) {
          song_queue.songs.unshift(song);
        } else if(song_queue.loop_queue) {
          song_queue.songs.push(song);
        }
        song_queue.songs.shift();
        await music_player(guild, song_queue.songs[0], interaction);
      }
    });

    player.on('error',  async (err) => {
      //if song crashes mid playback (errconn)
      //not sure if this is still an issue when using ytdl2
      //console.log(stream._readableState.errored.statusCode);
      //console.log(stream._readableState.errored.statusCode === 403);

      //if theres an error while playing the song (err 403), try to play it again (2 attempts 'tries<3')
      if(tries < 3 ) {
        setTimeout(async () => {
          await music_player(interaction.guild, song, interaction, tries + 1);
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
    try {
      await interaction.followUp({
        content: "```css\n[Error playing]\n   " + `0` + " : " + `${song.title}` + ` [${secondsToTime(song.length)}]`+ "```",
        ephemeral: true
      });
    } catch(err) {
      //console.error('error playing song')
    }

    await music_player(guild, song_queue.songs[0], interaction);
  }

}

module.exports = {
  command: command,
  exec: exec
}