import { ChannelType, LogLike, TextChannel } from "../types";
import { Bot } from "grammy";
import { convertDataToString } from "../utils";
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
    const content = convertDataToString(message); // TODO: implementar prettifyLogs depois da PR #4
    await this.client.api.sendMessage(this.groupId, content, {
      message_thread_id: this.topic.messageThreadId,
    });
  }
}
