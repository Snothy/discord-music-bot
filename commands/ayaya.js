command = {
  name: 'ayaya',
  description: 'Replies with AYAYA'
}

async function exec(interaction) {
  const reply = "```css\n[AYAYA]\n" + "```";
  await interaction.reply({
    content: reply,
    ephemeral: true
  });
}

module.exports = {
  command: command,
  exec: exec
}