const playlist = require('./playlist');
const secondsToTime = require('./utils');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

module.exports = async function getSongs(input) {
    let reply, currLength, songs, playlistData, songData;

    //get song data from input string (whether its a song title or youtube url link)   //if(ytdl.validateURL(input)) { old url validation
    if(input.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi,)) {
  
      //playlist handler from url
      if(input.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,) && /^.*(youtu.be\/|list=)([^#&?]*).*/gi.test(input)) {
          //console.log('link playlist');
          playlistData = await playlist(input);
          if(playlistData) {
            songs = playlistData.songs;
            reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";
          } else {
            reply = "```css\n[Load playlist failed]\n" + "```";
          }
        
      //if normal link (one song, not playlist)
      } else if (
        input.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,) && !/^.*(youtu.be\/|list=)([^#&?]*).*/gi.test(input)) {
        //console.log('link video');
        songData = await ytdl.getInfo(input)
        .catch(error => {
          //handle status 410 error (cant access information on video)
          reply = "```css\n[Add song failed]\n" + "```";
        });
        if(songData) {
          //this could lead to a playlist, rather than a single url
          songs = [{
            title: songData.videoDetails.title,
            url: songData.videoDetails.video_url,
            length: songData.videoDetails.lengthSeconds
          }]
          //reply = 'Playing ' + song.title;
          currLength = songs[0].length;
          currLength = secondsToTime(currLength);
          reply = "```css\n[Add song]\n   0 : " + `${songs[0].title}` + ` [${currLength}]`+ "```";
        }

  
      //if the link isnt youtube or a youtube playlist
      } else {
        reply = "```css\n" + `[Invalid URL]` + "```";
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
          if(playlistData) {
            songs = playlistData.songs;
            reply = "```css\n[Add playlist]\n   Playlist : " + `${playlistData.playlistData.title}` + ` [${secondsToTime(playlistData.playlistData.length)}]`+ "```";
          } else {
            reply = "```css\n[Load playlist failed]\n" + "```";
          }
  
        //handle normal video search
        } else {
          //console.log('normal video search');
          songs = [{
            title: searchResult.all[0].title,
            url: searchResult.all[0].url,
            length: searchResult.all[0].duration.seconds
          }]
          currLength = songs[0].length;
          currLength = secondsToTime(currLength);
          reply = "```css\n[Add song]\n   0 : " + `${songs[0].title}` + ` [${currLength}]`+ "```";
        }
  
      } else {
        reply = "```css\n[Add song failed]\n" + "```"
      }
    }

    return {songs:songs, reply:reply, playlistData: playlistData};
}