import {
  ChannelType,
  Client,
  DiscordAPIError,
  DiscordjsError,
  PermissionsBitField,
} from "discord.js";

import {
  botCommunication,
  botCommunicationError,
  BotErrorModules,
  ChannelTextCreation,
  InternalChannelType,
} from "./index.js";
import { ChannelBotMessage } from "./ChannelBotMessage.js";
import * as utils from "./utils.js";
import * as Types from "../types/index.js";
import { BotError } from "./BotError.js";

export class DiscordLogger implements Types.Platform {
  public readonly platform = Types.Platforms.DISCORD;
  private internalChannels: Map<string, ChannelBotMessage> = new Map();
  private botToken: string;
  private clientInstance: Client;
  private defaultChannel: ChannelTextCreation[];

  constructor({
    options,
    APIToken,
    defaultChannelBots,
  }: Types.PlatformDiscordConstructor) {
    this.clientInstance = new Client(
      options ?? {
        intents: "AutoModerationConfiguration",
      }
    );
    this.botToken = APIToken;
    this.defaultChannel = defaultChannelBots ?? [
      botCommunication,
      botCommunicationError,
    ];
  }

  get allChannels() {
    return this.internalChannels;
  }

  public async start() {
    await this.clientInstance.login(this.botToken);

    await new Promise((resolve) =>
      this.clientInstance.once("clientReady", async () => {
        await this.botChannels(this.defaultChannel);
        this.startChatResponse();
        console.log("Bot on!!! ✅");
        resolve(null);
      })
    );
  }

  public async createChannel(
    options: ChannelTextCreation,
    guildId: string,
    botOnly = false
  ): Promise<Types.Channel> {
    const guild = await this.clientInstance.guilds.fetch(guildId);

    const name = this.generateChannelName(options);
    const internalChannelType = this.channelTypeResolve(name);

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
      type: ChannelType.GuildText,
      name,
      reason: options.description,
      permissionOverwrites,
    });

    const instance = new ChannelBotMessage(channel, internalChannelType);

    this.addChannel(instance);

    return instance;
  }

  public getChannel(channelName: string) {
    const requestedChannel = this.internalChannels.get(channelName);
    if (!requestedChannel) {
      this.error(`O canal não existe ${channelName}`);
      return null;
    }
    return requestedChannel;
  }

  private async botChannels(defaultChannels: ChannelTextCreation[]) {
    const guilds = await this.clientInstance.guilds.fetch();

    for (const [, guild] of guilds) {
      await this.mapServerChannels(guild.id);
      await this.setDefaultChannels(defaultChannels, guild.id);
    }
  }

  private generateChannelName({ name, type }: ChannelTextCreation) {
    const formattedType = utils.pascalToKebab(type);
    const formattedName = utils.pascalToKebab(name);

    return `${formattedType}-${formattedName}`;
  }

  private decodeChannelByName(name: string) {
    const splitted = name.split("-");

    const channelDescribe =
      splitted[0] === "bot" ? splitted.slice(0, 2) : splitted.slice(0, 1);

    return {
      topic: utils.kebabToPascal(channelDescribe.join("-")),
      channelName: utils.kebabToPascal(splitted.join("-")),
    };
  }

  private channelTypeResolve(name: string): InternalChannelType {
    const decoded = this.decodeChannelByName(name);

    const topic = decoded?.topic;

    if (
      !topic ||
      !Object.values(InternalChannelType).includes(topic as InternalChannelType)
    ) {
      return InternalChannelType.Common;
    }

    return topic as InternalChannelType;
  }

  private async setDefaultChannels(
    defaultBotsConfig: ChannelTextCreation[],
    guildId: string
  ) {
    const channels = Array.from(this.internalChannels.values());
    const channelsType = channels.map((ch) => ch.type);
    const defaultChannelsToCreate = defaultBotsConfig.filter(
      (newCh) => !channelsType.includes(newCh.type)
    );

    for (const channel of defaultChannelsToCreate) {
      await this.createChannel(channel, guildId, true);
    }
  }

  private addChannel(channel: ChannelBotMessage) {
    const name = this.channelTypeResolve(channel.name);

    const isBot = name.includes("Bot");

    this.internalChannels.set(isBot ? name : channel.name, channel);
  }

  private async mapServerChannels(guildId: string) {
    const guildInfo = await this.clientInstance.guilds.fetch(guildId);
    const existingChannels = await guildInfo.channels.fetch();

    existingChannels
      .filter((ch) => ch?.type === ChannelType.GuildText)
      .forEach((ch) => {
        if (!this.internalChannels.has(ch.name)) {
          const name = this.channelTypeResolve(ch.name);

          const isBot = name.includes("Bot");

          this.internalChannels.set(
            isBot ? name : ch.name,
            new ChannelBotMessage(ch, name)
          );
        }
      });
  }

  async log(message: Types.LogLike) {
    const notifyChannel = this.internalChannels.get(
      InternalChannelType.BotNotification
    );
    if (!notifyChannel) {
      throw new BotError(
        "Canal de notificações do bot não definido",
        BotErrorModules.Instance
      );
    }
    try {
      await notifyChannel.sendMessage(message);
    } catch (err) {
      console.log("----- entrou aqui");
      if (err instanceof DiscordAPIError) {
        this.error({
          message: err.message,
          statusCode: err.status,
        });
        return;
      }
      if (err instanceof DiscordjsError) {
        this.error({
          name: err.name,
          message: err.message,
          cause: err.cause,
        });
        return;
      }
      this.error({
        type: "Unowned",
        message: err,
      });
    }
  }

  async error(message: Types.LogLike) {
    const errorChannel = this.internalChannels.get(
      InternalChannelType.BotError
    );
    if (errorChannel) {
      await errorChannel.sendMessage(message);
      return;
    }
    await this.log(message);
  }

  private startChatResponse() {
    this.clientInstance.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      const content = message.content.toLocaleLowerCase();
      if (content.startsWith("!")) {
        const cleanCommand = content.replace("!", "");
        switch (cleanCommand) {
          case "listchannels":
            this.log(
              Array.from(this.internalChannels.entries()).map(
                ([str, ch]) => `${str} - ${ch.name}`
              )
            );
            break;
          default:
            this.error("Comando não implementado");
        }
      }
    });
  }
}
