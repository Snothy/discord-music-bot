const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const handler = require('./models/handler');
const voice = require ('@discordjs/voice');
//require('dotenv').config();


const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
handler.init();

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      //Routes.applicationGuildCommands(process.env.client_id, process.env.guild_id),
      Routes.applicationCommands(process.env.client_id),
      { body: handler.commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();



const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
] });
//client.setMaxListeners(20);
client.queue = new Map();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(`in ${client.guilds.cache.size} servers`, {type: "PLAYING"});
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  let server_queue = client.queue.get(interaction.guildId);
  await handler.replies(interaction, server_queue);
});

//if left alone in vc => disconnect after x amount of time
client.on('voiceStateUpdate', (oldState, newState) => {
  if (oldState.channelID !== oldState.guild.me.voice.channelID || newState.channel) {
    return;
  }

  if (!oldState.channel.members.size - 1) {
    const guildId = oldState.guild.id;
    setTimeout(() => {
      //check again if somebody has joined the vc
      if (oldState.channel.members.size === 1) {
        if(voice.getVoiceConnection(guildId)) {
          voice.getVoiceConnection(guildId).disconnect();
          //delete guild queue or does does the disconnect listener catch the dc?
        }
      }
    }, 1 * 01 * 3000); //4 minutes in ms
  }
});

client.on('error', (err) => {
  console.log(err.message);
})

client.login(process.env.TOKEN);