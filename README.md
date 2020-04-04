# NookBot

A Discord bot for a Swedish Animal Crossing community server, mainly
focused at enhancing New Horizons related features.

## Features

* Create temporary Dodo code specific chat channels
* Handle turnip prices (keep tabs on who has the highest price)
* Change nicknames of server members to a helpful format (name/island name/native fruit)
* Give out roles to members that give them Animal Crossing NPC personality-inspired colors

## Setup

Run `npm install`.

## Configuration

Copy `.env.example` to `.env` or set the environment variables listed there
or in `src/config.js`, and fill in the missing values.

| Environment variable | Purpose                                                                |
|----------------------|------------------------------------------------------------------------|
| BOT_TOKEN            | Your Discord bot token.                                                |
| GUILD_ID             | The ID of your Discord guild. Can be easily gotten via developer mode. |
| TURNIP_CHANNEL_ID    | The ID of the channel where turnip prices will be stored.              |
| DODO_CATEGORY_ID     | The ID of the category where Dodo channels will be created.            |
| BELL_EMOJI_ID        | The ID of the emoji representing the Animal Crossing currency, bells.  |
| TZ                   | The timezone to use, for example: Europe/Stockholm                     |

As you can see the bot is not exactly made for being invited to multiple servers.

## Running

Run `npm start`.