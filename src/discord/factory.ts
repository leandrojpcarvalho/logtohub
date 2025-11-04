import {
  TextChannel as DiscordTextChannel,
  Channel as DiscordChannel,
  VoiceChannel as DiscordVoiceChannel,
  ChannelType as DiscordChannelType,
} from "discord.js";

import {
  BotError,
  BotErrorModules,
  convertDataToString,
  LogLike,
  ChannelType,
  TextChannel,
  Channel,
  VoiceChannel,
} from "../index.js";
import { MessageFormatter } from '../utils/MessageFormater.js';

class InternalTextChannel implements TextChannel {
  constructor(private channel: DiscordTextChannel, public type: ChannelType) {}

  get description() {
    return this.channel.topic;
  }

  get groupId() {
    return this.channel.guildId;
  }
  get name() {
    return this.channel.name;
  }

  async sendMessage(message: LogLike, prettifyLogs: boolean = false): Promise<void> {
    const content = prettifyLogs
      ? MessageFormatter.format(message)
      : convertDataToString(message);

    await this.channel.send({
      content,
    });
  }
}

class InternalVoiceChannel implements VoiceChannel {
  constructor(private channel: DiscordVoiceChannel, public type: ChannelType) {}

  get name() {
    return this.channel.name;
  }

  async sendMessage(message: LogLike, prettifyLogs: boolean = false): Promise<void> {
    const chat = this.channel.parent?.children.cache.find(
      (ch) => ch.type === DiscordChannelType.GuildText
    );

    if (!chat) return;

    const content = prettifyLogs
      ? MessageFormatter.format(message)
      : convertDataToString(message);

    await chat.send(content);
  }
}

export function discordChannelAdapter(
  discordChannel: DiscordChannel,
  type: ChannelType
): Channel {
  //criar função para identificar bot e canais comuns do discord
  if (discordChannel instanceof DiscordTextChannel) {
    return new InternalTextChannel(discordChannel, type);
  }
  if (discordChannel instanceof DiscordVoiceChannel) {
    return new InternalVoiceChannel(discordChannel, ChannelType.Common);
  }

  throw new BotError("Tipo de canal não suportado", BotErrorModules.Instance);
}
