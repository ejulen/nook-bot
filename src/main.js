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
const { BOT_TOKEN } = require("./config");

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

const bot = new Eris.Client(BOT_TOKEN);

bot.on("messageCreate", async (message) => {
  if (message.channel.type !== Eris.Constants.ChannelTypes.GUILD_TEXT) {
    return;
  }

  if (message.mentions.some((user) => user.id === bot.user.id)) {
    const content = message.content
      .trim()
      .replace(new RegExp(`^<@!?${bot.user.id}>\\s*`), "");

    for (let handler of MESSAGE_ROUTER) {
      const match = content.match(handler.PATTERN);
      if (match) {
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

    await message.channel
      .createMessage(`Hmm, ${message.author.mention}, nu förstod jag inte riktigt vad du menade. Du kan skriva

${bot.user.mention} hjälp

för att se vad jag kan göra.`);
  }
});

bot.once("ready", () => {
  setupTurnipPriceClearer(bot);
});

bot.connect();
