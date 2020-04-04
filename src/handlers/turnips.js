const { TURNIP_CHANNEL_ID, BELL_EMOJI_ID, GUILD_ID } = require("../config");
const { dateFormatter, Lock } = require("../helpers");
const CronJob = require("cron").CronJob;
const Eris = require("eris");

const TURNIP_HEADER = "Turnip-priser:";
const TURNIP_PRICING_CLEAR_TIMES = [8, 12, 22];

const lock = new Lock();

/**
 * @typedef {Object} PriceEntry
 * @prop {string} userMention
 * @prop {number} parsedPrice
 */

/**
 *
 * @param {import('../main').BotContext} context
 * @param {{turnipPrice: string}} params
 */
async function registerTurnipPrice({ message, channel, bot }, { turnipPrice }) {
  if (message.channel.id !== TURNIP_CHANNEL_ID) {
    return;
  }

  await lock.acquire(async () => {
    const parsedPrice = parseInt(turnipPrice, 10);
    const { newHighest } = await updateTurnipPrices({
      bot,
      channel,
      newPrices: [
        {
          userMention: message.author.mention,
          parsedPrice,
        },
      ],
    });
    if (newHighest) {
      await message.channel.createMessage(
        `:tada: Ding ding ding! Nytt högsta pris registrerat från ${message.author.mention} på ${turnipPrice}${BELL_EMOJI_ID}!`
      );
    } else {
      await message.channel.createMessage(
        `Tack, ${message.author.mention}, ditt pris är registrerat!`
      );
    }
  });
}

registerTurnipPrice.PATTERN = /^(turnips?|majrov(a|or)) (?<turnipPrice>\d+)/i;

/**
 * @param {string} content
 */
function parseTurnipMessage(content) {
  const lines = content.split("\n").slice(4); // skip first 4 lines - they're the header and the metadata, with spacing
  const entries = lines.map((line) => {
    const [userMention, price] = line.split(" ");
    const parsedPrice = parseInt(price, 10);
    return { userMention, parsedPrice };
  });
  return entries;
}

function createTurnipHeader() {
  return `${TURNIP_HEADER}\n\nSenast uppdaterad: ${dateFormatter.format()}`;
}

/**
 * @param {PriceEntry[]} prices
 */
function createTurnipPriceList(prices) {
  const priceList = prices
    .map(
      ({ userMention, parsedPrice }) =>
        `${userMention} ${parsedPrice}${BELL_EMOJI_ID}`
    )
    .join("\n");
  return `${createTurnipHeader()}\n\n${priceList}`;
}

/**
 * @param {{bot: import('eris').Client, channel: import('eris').GuildTextableChannel}} context
 */
async function getTurnipPricesMessage({ bot, channel }) {
  let pinnedMessage = (await channel.getPins()).find(
    (pinnedMessage) =>
      pinnedMessage.author.id === bot.user.id &&
      pinnedMessage.cleanContent.startsWith(TURNIP_HEADER)
  );

  if (!pinnedMessage) {
    pinnedMessage = await channel.createMessage(TURNIP_HEADER);
    await pinnedMessage.pin();
  }

  return pinnedMessage;
}

/**
 *
 * @param {{bot: import('eris').Client, channel: import('eris').GuildTextableChannel, newPrices: PriceEntry[], append?: boolean}} param0
 */
async function updateTurnipPrices({ bot, channel, newPrices, append = true }) {
  const pinnedMessage = await getTurnipPricesMessage({ bot, channel });
  const currentPrices = parseTurnipMessage(pinnedMessage.content);
  const result = [
    ...(append
      ? currentPrices.filter(
          (a) => !newPrices.some((b) => b.userMention === a.userMention)
        )
      : []),
    ...newPrices,
  ].sort((a, b) => b.parsedPrice - a.parsedPrice);
  await pinnedMessage.edit(createTurnipPriceList(result));
  if (result.length > 0) {
    await channel.edit({
      topic: `Högsta pris just nu: ${result[0].parsedPrice} från ${result[0].userMention}`,
      name: channel.name.replace(/-\d+$/, "") + `-${result[0].parsedPrice}`,
    });
  } else {
    await channel.edit({
      topic: "Inga priser registrerade ännu.",
      name: channel.name.replace(/-\d+$/, ""),
    });
  }
  return {
    newHighest:
      currentPrices.length < 1 ||
      (result.length > 0 &&
        currentPrices[0].parsedPrice < result[0].parsedPrice),
  };
}

/**
 * @param {import('eris').Client} bot
 */
function setupTurnipPriceClearer(bot) {
  let lastClear;
  setInterval(() => {
    const date = new Date();
    if (
      TURNIP_PRICING_CLEAR_TIMES.includes(date.getHours()) &&
      (!lastClear || lastClear.getHours() !== date.getHours())
    ) {
      lock.acquire(async () => {
        const turnipChannel = bot.guilds
          .find((guild) => guild.id === GUILD_ID)
          .channels.find((channel) => channel.id === TURNIP_CHANNEL_ID);

        if (
          !turnipChannel ||
          turnipChannel.type !== Eris.Constants.ChannelTypes.GUILD_TEXT
        ) {
          console.error(
            "setupTurnipPriceClearer: Could not find turnip channel."
          );
          return;
        }
        await turnipChannel.createMessage("Nu tömmer jag prislistan!");
        await updateTurnipPrices({
          bot,
          channel: turnipChannel,
          newPrices: [],
          append: false,
        });
        lastClear = date;
      });
    }
  }, 1000 * 10);
}

module.exports = { registerTurnipPrice, setupTurnipPriceClearer };
