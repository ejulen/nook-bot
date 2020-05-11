const { COMMAND_PREFIX } = require("../config");
const { getPersonalityRoles } = require("./personality");

/**
 * @type {import('../main').Handler}
 */
async function help({ channel, guild }) {
  await channel.createMessage(`Här är vad jag kan göra:

**Skapa Dodo-kod-specifika kanaler:**
\`${COMMAND_PREFIX}dodo dodokod valfritt meddelande\`
Till exempel: \`${COMMAND_PREFIX}dodo abc12\`
eller
\`${COMMAND_PREFIX}dodo abc12 Välkommen till min ö${COMMAND_PREFIX}\`

**Ändra ditt smeknamn till Namn/Ö/Ursprungsfrukt-formatet:**
\`${COMMAND_PREFIX}nick Namn/Ö/frukt\`
Till exempel: \`${COMMAND_PREFIX}nick Kerry/Härnta/persika\`
Det går bra att skriva fruktens namn på både svenska och engelska.

**Ändra färgen på ditt användarnamn:**
\`${COMMAND_PREFIX}färg färgnamn\`
Till exempel: \`${COMMAND_PREFIX}färg lazy\`
Tillgängliga färger: ${getPersonalityRoles(guild)
    .map((role) => role.mention)
    .join(", ")}

**Hålla reda på vem som har de bästa turnip-priserna:**
\`${COMMAND_PREFIX}turnip pris\`
Till exempel: \`${COMMAND_PREFIX}turnip 150\`
`);
}

help.PATTERN = /^hjälp/i;

module.exports = { help };
