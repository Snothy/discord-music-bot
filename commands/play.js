command = {
  name: 'play',
  description: 'doesnt really do anything yet'
}

async function exec(interaction) {
  await interaction.reply({
    content: 'wat u want men i no work',
    ephemeral: true
  });
}

module.exports = {
  command: command,
  exec: exec
}