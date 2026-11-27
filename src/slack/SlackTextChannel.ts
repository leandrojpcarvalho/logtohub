import { WebClient } from "@slack/web-api";
import { BotErrorModules, ChannelType, LogLike, TextChannel } from "../types";
import { convertDataToString } from "../utils";
import { getSlackErrorCode, toSlackBotError } from "./utils";

const SLACK_TEXT_LIMIT = 4000;
const TRUNCATED_SUFFIX = "\n…(mensagem truncada)";
const NOT_IN_CHANNEL = "not_in_channel";

export class SlackTextChannel implements TextChannel {
  constructor(
    private readonly client: WebClient,
    public readonly id: string,
    public readonly name: string,
    public readonly type: ChannelType,
    public readonly groupId?: string,
    public readonly description?: string | null,
  ) {}

  public async sendMessage(message: LogLike): Promise<void> {
    const text = this.truncate(convertDataToString(message));

    try {
      await this.post(text);
    } catch (err) {
      if (getSlackErrorCode(err) !== NOT_IN_CHANNEL) {
        throw toSlackBotError(err, BotErrorModules.Communication);
      }

      try {
        await this.client.conversations.join({ channel: this.id });
        await this.post(text);
      } catch (retryErr) {
        throw toSlackBotError(retryErr, BotErrorModules.Communication);
      }
    }
  }

  private post(text: string) {
    return this.client.chat.postMessage({
      channel: this.id,
      text,
      mrkdwn: true,
    });
  }

  private truncate(text: string): string {
    if (text.length <= SLACK_TEXT_LIMIT) return text;

    return (
      text.slice(0, SLACK_TEXT_LIMIT - TRUNCATED_SUFFIX.length) +
      TRUNCATED_SUFFIX
    );
  }
}
