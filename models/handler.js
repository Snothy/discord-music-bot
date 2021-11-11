const fs = require('fs');

let commands = [];
let execution = {};

function init() {
  try {
  var path = require('path');
  let route = path.resolve(process.cwd(), './commands/');
    var files = fs.readdirSync(route);
    for(var i in files) {
        if(files[i].endsWith('.js')) {
          //console.log(files[i]);
          route = path.resolve(process.cwd(), './commands/', files[i]);
          const command = require(route).command;
          const exec = require(route).exec;
          commands.push(command);
          execution[command.name] = exec;
        }
    };
  } catch(err) {
    console.error(err);
  }
}

async function replies(interaction, serverQueue) {
  await execution[interaction.commandName](interaction, serverQueue);
}

module.exports = {
  init: init,
  commands: commands,
  replies: replies
}
