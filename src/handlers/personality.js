const personalityRoleNames = [
  "cranky",
  "jock",
  "peppy",
  "snooty",
  "lazy",
  "uchi",
  "normal",
  "smug"
];

/**
 * @type {import('../main').Handler}
 */
async function changePersonality({ message, guild, channel }, { personality }) {
  try {
    const personalityRoles = guild.roles.filter(role =>
      personalityRoleNames.includes(role.name)
    );
    const soughtRole = personalityRoles.find(role => role.name === personality);
    if (!soughtRole) {
      await channel.createMessage(
        `Ledsen, ${
          message.author.mention
        }, förstår inte vilken roll/färg du menar. Här är de som finns tillgängliga: ${personalityRoles
          .map(role => role.mention)
          .join(", ")}`
      );
      return;
    }

    const previousPersonalityRole = guild.roles.find(
      role =>
        personalityRoleNames.includes(role.name) &&
        message.member.roles.includes(role.id)
    );
    if (previousPersonalityRole) {
      await message.member.removeRole(previousPersonalityRole.id);
    }
    await message.member.addRole(soughtRole.id);
    await channel.createMessage(
      `Fixat, ${message.author.mention}! Du har nu färgen ${soughtRole.mention}!`
    );
  } catch (e) {
    console.error(e);
    await channel.createMessage(
      `Hmm, gick inte så bra det där. Om du har högre rang än mig kan jag tyvärr inte byta färg på dig.`
    );
  }
}

changePersonality.PATTERN = /^(role|roll|personality|personlighet|color|färg) @?(?<personality>.+)/;

module.exports = { changePersonality };
