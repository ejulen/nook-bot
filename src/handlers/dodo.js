const Eris = require("eris");
const { Lock } = require("../helpers");

const { DODO_CATEGORY_ID } = require("../config");

const lock = new Lock();

/**
 * @type {import('../main').Handler}
 */
function createDodoChannel({ message, guild, bot }, { dodoCode, dodoMessage }) {
  return lock.acquire(async () => {
    const alreadyCreatedChannel = await getDodoChannelByUserId(
      guild,
      message.author.id
    );
    if (alreadyCreatedChannel) {
      await message.channel.createMessage(
        `Ledsen, ${message.author.mention}, men du har redan skapat en Dodo-kanal: ${alreadyCreatedChannel.mention}`
      );
      return;
    }

    const cleanedDodoMessage = dodoMessage ? dodoMessage.trim() : undefined;

    const newChannel = await guild.createChannel(
      dodoCode,
      Eris.Constants.ChannelTypes.GUILD_TEXT,
      {
        parentID: DODO_CATEGORY_ID
      }
    );

    let welcomeMessageText;
    if (cleanedDodoMessage) {
      welcomeMessageText = `${
        message.author.mention
      } skapade den här kanalen, med följande meddelande:

${"> " + cleanedDodoMessage.replace(/\n/g, "\n> ")}`;
    } else {
      welcomeMessageText = `${message.author.mention} skapade den här kanalen.`;
    }
    welcomeMessageText += `\n\nHen kan skriva\n\n${bot.user.mention} stäng\n\nför att stänga kanalen.`;

    const welcomeMessage = await newChannel.createMessage(welcomeMessageText);
    await welcomeMessage.pin();

    await message.channel.createMessage(
      `Okej, skapade en Dodo-kanal: ${newChannel.mention} :thumbsup:`
    );
  });
}

createDodoChannel.PATTERN = /^dodo (?<dodoCode>[a-z0-9]{5})(\s+(?<dodoMessage>[\s\S]+))?/i;

/**
 * @param {import('../main').BotContext} context
 */
async function closeDodoChannel({ message, channel }) {
  await lock.acquire(async () => {
    if (channel.parentID !== DODO_CATEGORY_ID) {
      return;
    }

    const initialPin = (await message.channel.getPins())[0];
    if (!initialPin.mentions.some(user => user.id === message.author.id)) {
      return;
    }
  });

  await message.channel.createMessage(
    "Ok! Tar bort den här kanalen om 15 sekunder."
  );

  await new Promise(resolve => setTimeout(resolve, 15000));

  await lock.acquire(async () => {
    await channel.delete();
  });
}

closeDodoChannel.PATTERN = /^stäng/i;

/**
 * @param {import('eris').Guild} guild
 * @param {import('eris').User['id']} userId
 */
async function getDodoChannelByUserId(guild, userId) {
  const dodoChannels = guild.channels.filter(
    channel => channel.parentID === DODO_CATEGORY_ID
  );
  for (let channel of dodoChannels) {
    if (channel.type === Eris.Constants.ChannelTypes.GUILD_TEXT) {
      const initialPin = (await channel.getPins())[0];
      if (initialPin.mentions.some(user => user.id === userId)) {
        return channel;
      }
    }
  }
}

module.exports = { createDodoChannel, closeDodoChannel };
