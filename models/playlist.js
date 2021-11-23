const ytpl = require('ytpl');

module.exports = async function playlist(url) {
  url = url.split('list=')[1].split('&index=')[0].split('&start_radio=')[0].split('&t=')[0].split('&rv=')[0];
  let playlist;
  try {
    playlist = await ytpl(url, {limit:300});
  } catch(err) {
    return;
  }
  
  if(!playlist) {
    console.log('couldnt get playlist info');
  }
  let songs = [];
  let fullLength = 0;
  
  playlist.items.map(song => {
    if(song) {
      fullLength = fullLength + song.durationSec;
      songs.push({
        title: song.title,
        url: song.url,
        length: song.durationSec
      });
    }
  });
  return {songs:songs, playlistData: {
    title: playlist.title,
    url: playlist.url,
    items: playlist.items.length,
    length: fullLength
  }};
}