import {
  ChannelType as DiscordChannelType,
  Client as DiscordClient,
  NonThreadGuildBasedChannel,
  PermissionsBitField,
  TextChannel,
} from "discord.js";

import { discordChannelAdapter } from "./factory.js";
import * as utils from "./utils.js";
import * as Types from "../types/index.js";
import { Logger } from "../AbstractLogger.js";

import { defaultBotChannels } from "./channels/index.js";
import { CreateTextChannelProps } from "../types/index.js";
import { BotError } from '../utils/BotError.js';

interface IsValidChannelArgs {
  channel: NonThreadGuildBasedChannel | null;
  guildId?: string;
}

interface Rule {
  condition: boolean | (() => boolean);
  message: string;
  throwlable?: boolean;
}

export class DiscordLogger extends Logger {
  private clientInstance: DiscordClient;

  static async getInstance({
    options,
    APIToken,
    channelBots,
    internalLogs,
    guildId,
    prettifyLogs,
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
          .filter((ch): ch is TextChannel => this.isValidChannel({ channel: ch, guildId }))
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
          internalLogs,
          prettifyLogs,
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

  private static isValidChannel({ channel, guildId }: IsValidChannelArgs): boolean {
    if (!channel) return false;

    const rules: Rule[] = [
      { condition: channel.type === DiscordChannelType.GuildText, message: "Canal não é do tipo texto." },
      {
        condition: !guildId || channel.guildId === guildId,
        message: `Canal ${channel.name} não pertence à guilda especificada.\nID esperado: ${guildId}, recebido: ${channel.guildId}`,
        throwlable: true,
      },
    ]

    for (const rule of rules) {
      const condition = typeof rule.condition === "function" ? rule.condition() : rule.condition;
      if (!condition) {
        if (rule.throwlable) {
          throw new BotError(rule.message, Types.BotErrorModules.Instance);
        }

        return false;
      }
    }

    return true;
  }

  private constructor(
    existingChannels: Types.TextChannel[],
    channelsToCreate: Types.CreationChannels,
    client: DiscordClient,
    internalLogs: boolean = false,
    prettifyLogs: boolean = false
  ) {
    super(Types.Platforms.DISCORD, existingChannels, internalLogs, prettifyLogs);
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
