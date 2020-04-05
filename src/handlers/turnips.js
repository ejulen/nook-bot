const { TURNIP_CHANNEL_ID, BELL_EMOJI_ID, GUILD_ID } = require("../config");
const { dateFormatter, Lock } = require("../helpers");
const Eris = require("eris");

const HEADER = "Turnip-priser:";
/** @type {ClearEntry[]} */
const SALE_PRICING_CLEAR = [
  {
    hour: 8,
    message: "Jag tömmer prislistan, då Nook's Cranny öppnar nu.",
  },
  {
    hour: 12,
    message:
      "Nu tömmer jag prislistan igen, eftersom priset förändras mitt på dagen.",
  },
  {
    hour: 22,
    message: "Tömmer listan återigen eftersom Nook's Cranny stänger nu.",
  },
];
/** @type {ClearEntry[]} */
const PURCHASE_PRICING_CLEAR = [
  {
    hour: 8,
    message:
      "Nu blir det tomt i listan eftersom det är söndag och Daisy Mae kommer på besök!",
  },
  {
    hour: 12,
    message: "Listan töms nu eftersom Daisy Mae drar vid klockan 12.",
  },
];
const PURCHASE_DAY = 0; // Sunday

const lock = new Lock();

/**
 * @typedef {Object} PriceEntry
 * @prop {string} userMention
 * @prop {number} parsedPrice
 */

/**
 * @typedef {Object} ClearEntry
 * @prop {number} hour
 * @prop {string} message
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
    const date = new Date();
    const parsedPrice = parseInt(turnipPrice, 10);
    const { newBest } = await updateTurnipPrices({
      bot,
      channel,
      newPrices: [
        {
          userMention: message.author.mention,
          parsedPrice,
        },
      ],
      date,
    });
    if (newBest) {
      await message.channel.createMessage(
        `:tada: Ding ding ding! Nytt ${
          isPurchaseDay(date) ? "lägsta" : "högsta"
        } pris registrerat från ${
          message.author.mention
        } på ${turnipPrice}${BELL_EMOJI_ID}!`
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
  return `${HEADER}\n\nSenast uppdaterad: ${dateFormatter.format()}`;
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
      pinnedMessage.cleanContent.startsWith(HEADER)
  );

  if (!pinnedMessage) {
    pinnedMessage = await channel.createMessage(HEADER);
    await pinnedMessage.pin();
  }

  return pinnedMessage;
}

/**
 *
 * @param {{bot: import('eris').Client, channel: import('eris').GuildTextableChannel, newPrices: PriceEntry[], append?: boolean, date: Date}} param0
 */
async function updateTurnipPrices({
  bot,
  channel,
  newPrices,
  append = true,
  date,
}) {
  const pinnedMessage = await getTurnipPricesMessage({ bot, channel });
  const currentPrices = parseTurnipMessage(pinnedMessage.content);
  const comparisonFunction = comparePrices(date);
  const result = [
    ...(append
      ? currentPrices.filter(
          (a) => !newPrices.some((b) => b.userMention === a.userMention)
        )
      : []),
    ...newPrices,
  ].sort(comparisonFunction);
  await pinnedMessage.edit(createTurnipPriceList(result));
  if (result.length > 0) {
    await channel.edit({
      topic: `${isPurchaseDay(date) ? "Lägsta" : "Högsta"} pris just nu: ${
        result[0].parsedPrice
      } från ${result[0].userMention}`,
      name: channel.name.replace(/-\d+$/, "") + `-${result[0].parsedPrice}`,
    });
  } else {
    await channel.edit({
      topic: "Inga priser registrerade ännu.",
      name: channel.name.replace(/-\d+$/, ""),
    });
  }
  return {
    newBest:
      currentPrices.length < 1 ||
      (result.length > 0 &&
        comparisonFunction(currentPrices[0], result[0]) > 0),
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
      isClearingHour(date) &&
      (!lastClear || lastClear.getHours() !== date.getHours())
    ) {
      lock.acquire(async () => {
        try {
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
          await turnipChannel.createMessage(getClearMessage(date));
          await updateTurnipPrices({
            bot,
            channel: turnipChannel,
            newPrices: [],
            append: false,
            date,
          });
          lastClear = date;
        } catch (e) {
          console.error(
            "Tried to clear turnip prices, but something went wrong:",
            e
          );
        }
      });
    }
  }, 1000 * 10);
}

function isPurchaseDay(date = new Date()) {
  return date.getDay() === PURCHASE_DAY;
}

/**
 * @param {Date} date
 * @return {(a: PriceEntry, b: PriceEntry) => number}
 */
function comparePrices(date) {
  return (a, b) =>
    isPurchaseDay(date)
      ? a.parsedPrice - b.parsedPrice
      : b.parsedPrice - a.parsedPrice;
}

/**
 * @param {Date} date
 * @return {string}
 */
function getClearMessage(date) {
  const clearEntry = (isPurchaseDay(date)
    ? PURCHASE_PRICING_CLEAR
    : SALE_PRICING_CLEAR
  ).find(({ hour }) => hour === date.getHours());
  return clearEntry ? clearEntry.message : "Tömde prislistan just!";
}

/**
 * @param {Date} date
 * @return {boolean}
 */
function isClearingHour(date) {
  return (isPurchaseDay(date)
    ? PURCHASE_PRICING_CLEAR
    : SALE_PRICING_CLEAR
  ).some(({ hour }) => hour === date.getHours());
}

module.exports = { registerTurnipPrice, setupTurnipPriceClearer };
