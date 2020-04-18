const Eris = require("eris");
const { quote } = require("../helpers");
const AwaitLock = require("await-lock").default;

const { DODO_CATEGORY_ID } = require("../config");

const lock = new AwaitLock();

const closeTimers = {};

/**
 * @type {import('../main').Handler}
 */
async function createDodoChannel(
  { message, guild, bot },
  { dodoCode, dodoMessage }
) {
  await lock.acquireAsync();
  try {
    const alreadyCreatedChannel = await getDodoChannelByUserId(
      guild,
      message.author.id
    );
    if (alreadyCreatedChannel) {
      clearTimeout(closeTimers[alreadyCreatedChannel.id]);
      await message.channel.createMessage(
        `Eftersom du redan skapat en Dodo-kanal, ${message.author.mention}, kommer jag ändra koden till den befintliga istället.`
      );
      await alreadyCreatedChannel.edit({ name: dodoCode });
      let newMessage = `Koden har nu ändrats till ${dodoCode}.`;
      if (dodoMessage) {
        newMessage += `\n\nKanalskaparen skrev även följande:\n\n${quote(
          dodoMessage.trim()
        )}`;
      }
      await alreadyCreatedChannel.createMessage(newMessage);
      return;
    }

    const cleanedDodoMessage = dodoMessage ? dodoMessage.trim() : undefined;

    const newChannel = await guild.createChannel(
      dodoCode,
      Eris.Constants.ChannelTypes.GUILD_TEXT,
      {
        parentID: DODO_CATEGORY_ID,
      }
    );

    let welcomeMessageText;
    if (cleanedDodoMessage) {
      welcomeMessageText = `${
        message.author.mention
      } skapade den här kanalen, med följande meddelande:

${quote(cleanedDodoMessage)}`;
    } else {
      welcomeMessageText = `${message.author.mention} skapade den här kanalen.`;
    }
    welcomeMessageText += `\n\nHen kan skriva\n\n${bot.user.mention} stäng\n\nför att stänga kanalen. För att avbryta stängningen kan hen skriva:\n\n${bot.user.mention} avbryt\n\nFör att uppdatera koden kan hen använda sig av samma kommando som man använder för att skapa en Dodo-kanal. Då kommer den här kanalen uppdateras istället.`;

    const welcomeMessage = await newChannel.createMessage(welcomeMessageText);
    await welcomeMessage.pin();

    await message.channel.createMessage(
      `Okej, skapade en Dodo-kanal: ${newChannel.mention} :thumbsup:`
    );
  } finally {
    lock.release();
  }
}

createDodoChannel.PATTERN = /^dodo\s*(-?code\s*)?:?\s*(?<dodoCode>[a-z0-9]{5})(\s+(?<dodoMessage>[\s\S]+))?/i;

/**
 * @param {import('../main').BotContext} context
 */
async function closeDodoChannel({ message, guild }) {
  /** @type {import('eris').GuildTextableChannel?} */
  let dodoChannel;

  await lock.acquireAsync();
  try {
    dodoChannel = await getDodoChannelByUserId(guild, message.author.id);
  } finally {
    lock.release();
  }

  if (!dodoChannel) {
    return;
  }

  if (message.channel.id !== dodoChannel.id) {
    await message.channel.createMessage(
      "Ok! Tar bort din Dodo-kanal om 5 minuter."
    );
  }

  await dodoChannel.createMessage(
    "På begäran av kanalskaparen tas den här kanalen bort om 5 minuter."
  );

  closeTimers[dodoChannel.id] = setTimeout(async () => {
    await lock.acquireAsync();
    try {
      await dodoChannel.delete();
    } catch (e) {
      console.error("Could not delete Dodo channel:", e);
    } finally {
      lock.release();
    }
  }, 5 * 60 * 1000);
}

closeDodoChannel.PATTERN = /^stäng/i;

/**
 * @param {import('eris').Guild} guild
 * @param {import('eris').User['id']} userId
 * @return {Promise<import('eris').GuildTextableChannel?>}
 */
async function getDodoChannelByUserId(guild, userId) {
  const dodoChannels = guild.channels.filter(
    (channel) => channel.parentID === DODO_CATEGORY_ID
  );
  for (let channel of dodoChannels) {
    if (channel.type === Eris.Constants.ChannelTypes.GUILD_TEXT) {
      const initialPin = (await channel.getPins())[0];
      if (
        initialPin &&
        initialPin.mentions.length > 0 &&
        initialPin.mentions[0].id === userId
      ) {
        return channel;
      }
    }
  }
}

/**
 * @param {import('../main').BotContext} context
 */
async function cancelClosingDodoChannel({ message, guild }) {
  await lock.acquireAsync();
  try {
    const dodoChannel = await getDodoChannelByUserId(guild, message.author.id);
    if (dodoChannel) {
      clearTimeout(closeTimers[dodoChannel.id]);
      await message.channel.createMessage(
        `Ok, ${message.author.mention}, jag har avbrutit stängningen.`
      );
      if (message.channel.id !== dodoChannel.id) {
        await dodoChannel.createMessage(
          "På begäran av kanalskaparen har jag avbrutit stängningen av den här kanalen."
        );
      }
    } else {
      await message.channel.createMessage(
        `Hmm, ${message.author.mention}, ser inte ut som du har nån Dodo-kanal?`
      );
    }
  } finally {
    lock.release();
  }
}

cancelClosingDodoChannel.PATTERN = /^(avbryt|cancel)/i;

module.exports = {
  createDodoChannel,
  closeDodoChannel,
  cancelClosingDodoChannel,
};
