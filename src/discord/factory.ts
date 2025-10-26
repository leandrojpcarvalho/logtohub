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
import { DiscordChannelAdapterProps } from "./type.js";
import { generateChannelName } from "./utils.js";

abstract class AbstractDiscordChannel<
  T extends DiscordTextChannel | DiscordVoiceChannel
> implements Channel
{
  constructor(
    protected channel: T,
    public type: ChannelType,
    public env?: string
  ) {}

  abstract sendMessage(message: LogLike): Promise<void>;

  get name() {
    return this.channel.name;
  }

  get groupId() {
    return this.channel.guildId;
  }

  async removeChannel(): Promise<void> {
    if (
      this.channel.type === DiscordChannelType.GuildText &&
      this.channel.deletable
    ) {
      try {
        await this.channel.delete("Removido pelo bot");
      } catch (err) {
        console.error("Erro ao remover canal:", err);
      }
    }
  }
}
class InternalTextChannel
  extends AbstractDiscordChannel<DiscordTextChannel>
  implements TextChannel
{
  constructor(channel: DiscordTextChannel, type: ChannelType, env?: string) {
    super(channel, type, env);
  }

  get description() {
    return this.channel.topic;
  }

  async sendMessage(message: LogLike) {
    const content = convertDataToString(message);
    await this.channel.send({
      content,
    });
  }
}

class InternalVoiceChannel
  extends AbstractDiscordChannel<DiscordVoiceChannel>
  implements VoiceChannel
{
  constructor(channel: DiscordVoiceChannel, type: ChannelType, env?: string) {
    super(channel, type, env);
  }

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

export function discordChannelAdapter({
  discordChannel,
  type,
  env,
}: DiscordChannelAdapterProps): Channel {
  //criar função para identificar bot e canais comuns do discord
  if (discordChannel instanceof DiscordTextChannel) {
    return new InternalTextChannel(discordChannel, type, env);
  }
  if (discordChannel instanceof DiscordVoiceChannel) {
    return new InternalVoiceChannel(discordChannel, ChannelType.Common, env);
  }

  throw new BotError("Tipo de canal não suportado", BotErrorModules.Instance);
}
