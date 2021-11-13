command = {
  name: 'shuffle',
  description: 'Shuffle queue'
}

async function exec(interaction, server_queue) {
  //if no queue, cant shuffle
  if(!server_queue.songs) {
    await interaction.reply({
      content: "```css\n" + `[There is no queue.]` + "```",
      ephemeral: true
    });
    return
  }

  //ignore first song on shuffle
  currSong = server_queue.songs[0];
  server_queue.songs.splice(0,1);
  shuffleArray(server_queue.songs);
  server_queue.songs.splice(0, 0, currSong);

  const reply = "```css\n[Shuffle queue]\n" + "```";
  try {
    await interaction.reply({
      content: reply,
      ephemeral: false
    });
  } catch(err) {
    console.error('couldnt send message');
  }

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