import {
  TextChannel as DiscordTextChannel,
  Channel as DiscordChannel,
  VoiceChannel as DiscordVoiceChannel,
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

  async sendMessage(message: LogLike) {
    const content = convertDataToString(message);
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

  async sendMessage(message: LogLike): Promise<void> {
    const chat = this.channel.parent?.children.cache.find(
      (ch) => ch.type === 0
    );
    if (chat) {
      await chat.send(convertDataToString(message));
    }
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
