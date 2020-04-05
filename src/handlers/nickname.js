const FRUIT_EMOJI = {
  "🍊": /apelsin(er)?|oranges?/i,
  "🍎": /äpplen?|apples?/i,
  "🍐": /päron|pears?/i,
  "🍒": /körsbär|cherr(y|ies)/i,
  "🍑": /persik(a|or)|peach(es)?/i,
  "🥥": /kokosnöt(ter)?|coconuts?/i
};

/**
 *
 * @param {import('../main').BotContext} context
 * @param {{nickname: string, islandName: string, fruit: string}} params
 */
async function changeNickname({ message }, { nickname, islandName, fruit }) {
  const fruitEmojiEntry = Object.entries(FRUIT_EMOJI).find(([_, pattern]) =>
    fruit.match(pattern)
  );
  if (!fruitEmojiEntry) {
    await message.channel.createMessage(
      `${message.author.mention}, jag är ledsen, men jag fattar inte vilken frukt du menar.`
    );
    return;
  }
  const fruitEmoji = fruitEmojiEntry[0];
  const newNickname = `${nickname} / ${islandName} / ${fruitEmoji}`;
  try {
    await message.member.edit({
      nick: newNickname
    });
    await message.channel.createMessage(
      `Så, ${message.author.mention}, hoppas du är nöjd med ditt nya namn.`
    );
  } catch (e) {
    console.error(e);
    await message.channel.createMessage(
      `Ajdå, ${message.author.mention}, det gick inget vidare det där. Om du har högre rang än mig kan jag tyvärr inte byta smeknamn på dig, men prova kopiera detta: ${newNickname}`
    );
  }
}

changeNickname.PATTERN = /^(smeknamn|nick|nickname) (?<nickname>[^/]+)\/(?<islandName>[^/]+)\/(?<fruit>.+)/i;

module.exports = { changeNickname };
