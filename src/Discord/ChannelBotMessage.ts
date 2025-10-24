import { TextChannel } from "discord.js";
import { InternalChannelType } from "../types/enum.js";
import { convertDataToString } from "./utils.js";
import { Channel, Platforms } from "../types/interfaces.js";

export class ChannelBotMessage implements Channel {
  public readonly platform = Platforms.DISCORD;
  constructor(
    private channel: TextChannel,
    public type: InternalChannelType,
    private utils = {
      convertDataToString,
    }
  ) {}

  get description() {
    return this.channel.topic;
  }

  get groupId() {
    return this.channel.guildId;
  }
  get name() {
    return this.channel.name;
  }

  async sendMessage(message: unknown) {
    await this.channel.send({
      content: this.utils.convertDataToString(message),
    });
  }
}
