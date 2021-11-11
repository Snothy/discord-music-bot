command = {
  name: 'shuffle',
  description: 'Shuffle queue'
}

async function exec(interaction, server_queue) {
  //ignore first song on shuffle
  currSong = server_queue.songs[0];
  server_queue.songs.splice(0,1);
  shuffleArray(server_queue.songs);
  server_queue.songs.splice(0, 0, currSong);

  const reply = "```css\n[Shuffle queue]\n" + "```";
  await interaction.reply({
    content: reply,
    ephemeral: false
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

module.exports = {
  command: command,
  exec: exec
}