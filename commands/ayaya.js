command = {
  name: 'ayaya',
  description: 'Replies with AYAYA'
}

async function exec(interaction) {
  const reply = "```css\n[AYAYA]\n" + "```";
  try {
    await interaction.reply({
      content: reply,
      ephemeral: true
    });
  } catch(err) {
    console.error('couldnt send message');
  }

}

module.exports = {
  command: command,
  exec: exec
}