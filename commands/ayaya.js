command = {
  name: 'ayaya',
  description: 'Replies with AYAYA'
}

async function exec(interaction) {
  await interaction.reply({
    content: 'AYAYA',
    ephemeral: true
  });
}

module.exports = {
  command: command,
  exec: exec
}