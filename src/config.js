require("dotenv").config({
  debug: true,
});

const e = process.env;

const GUILD_ID = e.GUILD_ID;
const DODO_CATEGORY_ID = e.DODO_CATEGORY_ID;
const TURNIP_CHANNEL_ID = e.TURNIP_CHANNEL_ID;
const BOT_TOKEN = e.BOT_TOKEN;
const BELL_EMOJI_ID = e.BELL_EMOJI_ID;
const COMMAND_PREFIX = "!";

const config = {
  GUILD_ID,
  DODO_CATEGORY_ID,
  TURNIP_CHANNEL_ID,
  BOT_TOKEN,
  BELL_EMOJI_ID,
  COMMAND_PREFIX,
};

for (let [key, value] of Object.entries(config)) {
  if (value === undefined) {
    throw `config value ${key} not set`;
  }
}

module.exports = config;
