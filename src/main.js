const Eris = require("eris");
const {
  createDodoChannel,
  closeDodoChannel,
  cancelClosingDodoChannel,
} = require("./handlers/dodo");
const {
  registerTurnipPrice,
  setupTurnipPriceClearer,
} = require("./handlers/turnips");
const { changeNickname } = require("./handlers/nickname");
const { changePersonality } = require("./handlers/personality");
const { help } = require("./handlers/help");
const { BOT_TOKEN, COMMAND_PREFIX } = require("./config");

const MESSAGE_ROUTER = [
  createDodoChannel,
  closeDodoChannel,
  cancelClosingDodoChannel,
  registerTurnipPrice,
  changeNickname,
  changePersonality,
  help,
];

/**
 * @typedef {Object} BotContext
 * @prop {import('eris').Client} bot
 * @prop {import('eris').Message} message
 * @prop {import('eris').GuildTextableChannel} channel
 * @prop {import('eris').Guild} guild
 */

/**
 * @callback Handler
 * @param {BotContext} context
 * @param {{[key: string]: string}} params
 */

const bot = new Eris.Client(BOT_TOKEN, {
  allowedMentions: {
    everyone: false,
    roles: false,
    users: true,
  },
});

bot.on("messageCreate", async (message) => {
  if (message.channel.type !== Eris.Constants.ChannelTypes.GUILD_TEXT) {
    return;
  }

  console.log(
    `#${message.channel.name}> ${message.author.username}: ${message.content}`,
    message.mentions.map((mention) => mention.username),
    message.roleMentions
  );

  if (message.author.id === bot.user.id) {
    return;
  }

  const botMember = message.channel.guild.members.find(
    (member) => member.user.id === bot.user.id
  );
  const commandPattern = new RegExp(
    `^(\\${COMMAND_PREFIX}|<@(!|&)?(${bot.user.id}|${botMember.roles.join(
      "|"
    )})>\\s*)`
  );

  const content = message.content.trim();

  if (content.match(commandPattern)) {
    const cleanedContent = content.replace(commandPattern, "");

    for (let handler of MESSAGE_ROUTER) {
      const match = cleanedContent.match(handler.PATTERN);
      if (match) {
        console.log(`Matched command: ${handler.name}`);
        try {
          await handler(
            {
              message,
              bot,
              channel: message.channel,
              guild: message.channel.guild,
            },
            match.groups
          );
        } catch (e) {
          await message.channel.createMessage(
            `Nej du, ${message.author.mention}, nu gick nånting himla fel, men jag vet inte riktigt vad.`
          );
          console.error(e);
        }
        return;
      }
    }
  }
});

bot.once("ready", () => {
  setupTurnipPriceClearer(bot);
});

bot.on("error", (err) => {
  console.error(err);
});

bot.connect();
