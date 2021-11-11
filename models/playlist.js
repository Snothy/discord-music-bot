const ytpl = require('ytpl');

module.exports = async function playlist(url) {
  const playlist = await ytpl(url.split('list=')[1].split('&index=')[0], {limit:300}).catch();
  if(!playlist) {
    console.log('couldnt get playlist info');
  }
  let songs = [];
  let fullLength = 0;
  
  playlist.items.map(song => {
    fullLength = fullLength + song.durationSec;
    songs.push({
      title: song.title,
      url: song.shortUrl,
      length: song.durationSec
    });
  });
  return {songs:songs, playlistData: {
    title: playlist.title,
    url: playlist.url,
    items: playlist.items.length,
    length: fullLength
  }};
}