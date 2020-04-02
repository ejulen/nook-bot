/**
 * @type {import('../main').Handler}
 */
async function help({ channel, bot }) {
  const botMention = bot.user.mention;
  await channel.createMessage(`Här är vad jag kan göra:

**Skapa Dodo-kod-specifika kanaler:**
${botMention} dodo dodokod valfritt meddelande
Till exempel: ${botMention} dodo abc12
eller
${botMention} dodo abc12 Välkommen till min ö!

**Ändra ditt smeknamn till Namn/Ö/Ursprungsfrukt-formatet:**
${botMention} nick Namn/Ö/frukt
Till exempel: ${botMention} nick Kerry/Härnta/persika

**Ändra färgen på ditt användarnamn:**
${botMention} färg färgnamn
Till exempel: ${botMention} färg lazy

**Hålla reda på vem som har de bästa turnip-priserna:**
${botMention} turnip pris
Till exempel: ${botMention} turnip 150
`);
}

help.PATTERN = /^hjälp/i;

module.exports = { help };
