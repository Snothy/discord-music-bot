const ayaya = require('../commands/ayaya');
const play = require('../commands/play');

commands = [
  ayaya.command,
  play.command
]; 

const execution = {
  ayaya: ayaya.exec,
  play: play.exec
}

async function replies(interaction) {
  await execution[interaction.commandName](interaction);
}

module.exports = {
  commands: commands,
  replies: replies
}
