import { ChannelType, LogLike, TextChannel } from "@domain/index.js";
import { Bot } from "grammy";
import { convertDataToString } from "@utils/index.js";
import { InternalForumTopic } from "./types";

export class TelegramTextChannel implements TextChannel {
  constructor(
    private readonly client: Bot,
    private readonly topic: InternalForumTopic,
    public readonly type: ChannelType,
    public readonly groupId: string,
    public readonly description?: string | null
  ) {}

  get name() {
    return this.topic.name;
  }

  public async sendMessage(message: LogLike): Promise<void> {
    await this.client.api.sendMessage(this.groupId, convertDataToString(message), {
      message_thread_id: this.topic.messageThreadId,
      parse_mode: 'Markdown',
    });
  }
}
