const ayaya = require('../commands/ayaya');
const play = require('../commands/play');
const join = require('../commands/join');
const leave = require('../commands/leave');

commands = [
  ayaya.command,
  play.command,
  join.command,
  leave.command
]; 

const execution = {
  ayaya: ayaya.exec,
  play: play.exec,
  join: join.exec,
  leave: leave.exec
}

async function replies(interaction) {
  await execution[interaction.commandName](interaction);
}

module.exports = {
  commands: commands,
  replies: replies
}
