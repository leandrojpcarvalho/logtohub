import { ConversationsListResponse, WebClient } from "@slack/web-api";
import { Logger } from "../AbstractLogger.js";
import * as AT from "../types/index.js";
import * as ST from "./types.js";
import * as utils from "../utils/index.js";
import { BotError } from "../utils/index.js";
import { defaultBotChannels } from "../channels/index.js";
import { SlackTextChannel } from "./SlackTextChannel.js";
import { sanitizeSlackChannelName, toSlackBotError } from "./utils.js";

const CONVERSATIONS_PAGE_LIMIT = 200;

/**
 * SlackLogger implementation for logging messages to Slack channels.
 *
 * This class extends the abstract Logger class to provide Slack-specific functionality
 * for creating and managing text channels within a Slack workspace through the Web API.
 *
 * **Required Bot Token Scopes:**
 * - `chat:write`, `chat:write.public`
 * - `channels:read`, `channels:manage`, `channels:join`
 * - `groups:read`, `groups:write` (only when `privateChannels` is enabled)
 *
 * Unlike the TelegramLogger, no local memory is needed: on every start the
 * logger lists the workspace channels and rebuilds the mapping, like the DiscordLogger.
 * Only channels the bot is a member of (or the ones declared in `channelBots`)
 * are mapped, so channels such as `#general` never receive logs by fallback.
 *
 * **Private channels:** the bot cannot join an existing private channel by itself.
 * Invite it manually with `/invite @your-app`.
 *
 * @example
 * ```typescript
 * const logger = await SlackLogger.getInstance({
 *   APIToken: process.env.SLACK_BOT_TOKEN!,
 *   internalLogs: true,
 *   channelBots: [
 *     { name: 'api', type: ChannelType.BotError },
 *     { name: 'deploy', type: ChannelType.BotNotification }
 *   ]
 * });
 *
 * await logger.awaitReady();
 * ```
 */
export class SlackLogger extends Logger {
  private _clientInstance: WebClient;
  private _teamId: string;
  private _privateChannels: boolean;
  private _destroyed = false;

  private constructor(
    existingChannels: AT.TextChannel[],
    channelsToCreate: AT.CreationChannels,
    client: WebClient,
    teamId: string,
    privateChannels: boolean,
    internalLogs?: boolean,
  ) {
    super(AT.Platforms.SLACK, existingChannels, internalLogs);
    this._clientInstance = client;
    this._teamId = teamId;
    this._privateChannels = privateChannels;
    this.processChannels(channelsToCreate);
  }

  static async getInstance({
    APIToken,
    channelBots,
    internalLogs,
    teamId,
    privateChannels = false,
  }: ST.GetInstanceArgsSlack): Promise<SlackLogger> {
    const client = new WebClient(APIToken);

    const auth = await client.auth.test().catch((err) => {
      throw toSlackBotError(err);
    });
    const workspaceId = auth.team_id ?? "";

    if (teamId && teamId !== workspaceId) {
      throw new BotError(
        `O token pertence ao workspace ${workspaceId}, mas foi informado ${teamId}.`,
        AT.BotErrorModules.Instance,
      );
    }

    const wantedChannels = channelBots ?? defaultBotChannels;
    const wantedNames = new Set(
      wantedChannels.map((channel) => this.buildChannelName(channel)),
    );

    const existingChannels = await this.fetchChannels(
      client,
      workspaceId,
      privateChannels,
      wantedNames,
    );

    const existingNames = new Set(existingChannels.map((ch) => ch.name));
    const channelsToCreate = wantedChannels.filter(
      (channel) => !existingNames.has(this.buildChannelName(channel)),
    );

    console.log(
      utils.trimText(`
      ────────────────────────────────────────────
      🤖  Bot conectado com sucesso!
      🪪  Usuário: ${auth.user}
      🌐  Workspace: ${workspaceId} — ${auth.team}
      ────────────────────────────────────────────
    `),
    );

    return new SlackLogger(
      existingChannels,
      {
        channels: channelsToCreate,
        groupId: workspaceId,
      },
      client,
      workspaceId,
      privateChannels,
      internalLogs,
    );
  }

  async createChannel(
    options: AT.CreateTextChannelProps,
  ): Promise<AT.TextChannel> {
    const name = SlackLogger.buildChannelName(options);

    const { channel } = await this._clientInstance.conversations
      .create({ name, is_private: this._privateChannels })
      .catch((err) => {
        throw toSlackBotError(err);
      });

    if (!channel?.id) {
      throw new BotError(
        `O Slack não retornou o id do canal ${name}`,
        AT.BotErrorModules.Instance,
      );
    }

    if (options.description) {
      await this._clientInstance.conversations
        .setPurpose({ channel: channel.id, purpose: options.description })
        .catch(() =>
          this.internalLog(`Não foi possível definir a descrição de ${name}`),
        );
    }

    return new SlackTextChannel(
      this._clientInstance,
      channel.id,
      name,
      utils.channelTypeResolve(name),
      this._teamId,
      options.description,
    );
  }

  private static buildChannelName(props: AT.CreateTextChannelProps): string {
    return sanitizeSlackChannelName(utils.generateChannelName(props));
  }

  private static async fetchChannels(
    client: WebClient,
    teamId: string,
    privateChannels: boolean,
    wantedNames: Set<string>,
  ): Promise<SlackTextChannel[]> {
    const types = privateChannels
      ? "public_channel,private_channel"
      : "public_channel";
    const channels: SlackTextChannel[] = [];

    try {
      const pages = client.paginate("conversations.list", {
        types,
        exclude_archived: true,
        limit: CONVERSATIONS_PAGE_LIMIT,
      });

      for await (const page of pages) {
        for (const ch of (page as ConversationsListResponse).channels ?? []) {
          if (!ch.id || !ch.name) continue;
          if (!ch.is_member && !wantedNames.has(ch.name)) continue;

          channels.push(
            new SlackTextChannel(
              client,
              ch.id,
              ch.name,
              utils.channelTypeResolve(ch.name),
              teamId,
              ch.purpose?.value,
            ),
          );
        }
      }
    } catch (err) {
      throw toSlackBotError(err);
    }

    return channels;
  }

  public async destroy(): Promise<void> {
    if (this._destroyed) return;
    this._destroyed = true;
    this.internalLog("SlackLogger destruído com sucesso");
  }
}
