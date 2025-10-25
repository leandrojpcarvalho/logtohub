import {
  ChannelType as DiscordChannelType,
  Client as DiscordClient,
  PermissionsBitField,
  TextChannel,
} from "discord.js";

import { discordChannelAdapter } from "./factory.js";
import * as utils from "./utils.js";
import * as Types from "../types/index.js";
import { Logger } from "../AbstractLogger.js";

import { defaultBotChannels } from "./channels/index.js";
import { CreateTextChannelProps } from "../types/index.js";

export class DiscordLogger extends Logger {
  private clientInstance: DiscordClient;

  static async getInstance({
    options,
    APIToken,
    channelBots,
    internalLogs,
  }: Types.PlatformDiscordConstructor): Promise<DiscordLogger> {
    const discordEv = new DiscordClient(
      options ?? {
        intents: "AutoModerationConfiguration",
      }
    );

    await discordEv.login(APIToken);

    return new Promise<DiscordLogger>((resolve) =>
      discordEv.once("clientReady", async (client) => {
        // this bot just manager one discord server.
        const guildCollection = await client.guilds.fetch();
        const [, guild] = Array.from(guildCollection)[0];

        const { channels } = await client.guilds.fetch(guild.id);

        const allChannels = Array.from(await channels.fetch());

        const textChannels = allChannels
          .map(([, ch]) => ch)
          .filter((ch): ch is TextChannel => ch instanceof TextChannel)
          .map((ch) => {
            const type = utils.channelTypeResolve(ch.name);
            return discordChannelAdapter(ch, type);
          });

        const instance = new DiscordLogger(
          textChannels,
          {
            channels: channelBots ?? defaultBotChannels,
            groupId: guild.id,
          },
          client,
          internalLogs
        );

        console.log(`
────────────────────────────────────────────
🤖  Bot conectado com sucesso!
🪪  Usuário: ${client.user?.tag}
🌐  Guilda: ${guild.id} — ${guild.name}
────────────────────────────────────────────
`);

        resolve(instance);
      })
    );
  }

  private constructor(
    existingChannels: Types.TextChannel[],
    channelsToCreate: Types.CreationChannels,
    client: DiscordClient,
    internalLogs: boolean = false
  ) {
    super(Types.Platforms.DISCORD, existingChannels, internalLogs);
    this.clientInstance = client;
    this.processChannels(channelsToCreate);
  }

  public async createChannel(
    options: CreateTextChannelProps,
    guildId: string,
    botOnly = false
  ): Promise<Types.TextChannel> {
    const guild = await this.clientInstance.guilds.fetch(guildId);

    const name = utils.generateChannelName(options);
    const internalChannelType = utils.channelTypeResolve(name);

    const permissionOverwrites = botOnly
      ? [
          {
            id: guild.roles.everyone, // @everyone
            deny: [PermissionsBitField.Flags.SendMessages],
          },
          {
            id: this.clientInstance.user?.id!, // Bot
            allow: [PermissionsBitField.Flags.SendMessages],
          },
        ]
      : [];

    const channel = await guild.channels.create({
      type: DiscordChannelType.GuildText,
      name,
      reason: options.description,
      permissionOverwrites,
    });

    return discordChannelAdapter(channel, internalChannelType);
  }
}
