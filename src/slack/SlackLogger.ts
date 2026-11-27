import { ConversationsListResponse, WebClient } from "@slack/web-api";
import { Logger } from "@core";
import * as AT from "@domain/index.js";
import * as ST from "./types.js";
import * as utils from "@utils/index.js";
import { BotError } from "@utils/index.js";
import { defaultBotChannels } from "@channels/index.js";
import { SlackTextChannel } from "./SlackTextChannel.js";
import { SlackMembers } from "./SlackMembers.js";
import { sanitizeSlackChannelName, toSlackBotError } from "./utils.js";

const CONVERSATIONS_PAGE_LIMIT = 200;

interface FetchedChannel {
  channel: SlackTextChannel;
  isMember: boolean;
  isPrivate: boolean;
}

/**
 * SlackLogger implementation for logging messages to Slack channels.
 *
 * This class extends the abstract Logger class to provide Slack-specific functionality
 * for creating and managing text channels within a Slack workspace through the Web API.
 *
 * **Bot Token Scopes:**
 * - Sempre: `chat:write`, `chat:write.public`, `channels:read`, `channels:manage`, `channels:join`
 * - Canais privados: `groups:read`, `groups:write`
 * - Convidar membros: `channels:write.invites` (públicos), `groups:write.invites` (privados)
 * - `inviteOwner` / `everyone`: `users:read`
 * - Membros por e-mail: `users:read.email`
 *
 * Canais criados por um bot têm apenas o bot como membro. Por isso, por padrão,
 * o Primary Owner do workspace é convidado para todo canal (`inviteOwner: "primary"`).
 * Use `members`, `everyone` e `inviteOwner` (globais ou por canal) para controlar quem entra.
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
 *   members: ["tech-lead@empresa.com"],
 *   channelBots: [
 *     // público e com todo o workspace dentro
 *     { name: 'deploy', type: ChannelType.BotNotification, slack: { everyone: true } },
 *     // privado, só com quem for listado
 *     { name: 'api', type: ChannelType.BotError, slack: { private: true, members: ['U0123ABCD'] } }
 *   ]
 * });
 *
 * await logger.awaitReady();
 * ```
 */
export class SlackLogger extends Logger {
  private _clientInstance: WebClient;
  private _teamId: string;
  private _members: SlackMembers;
  private _destroyed = false;

  private constructor(
    existingChannels: AT.TextChannel[],
    channelsToCreate: AT.CreationChannels,
    client: WebClient,
    teamId: string,
    members: SlackMembers,
    internalLogs?: boolean,
  ) {
    super(AT.Platforms.SLACK, existingChannels, internalLogs);
    this._clientInstance = client;
    this._teamId = teamId;
    this._members = members;
    this.processChannels(channelsToCreate);
  }

  static async getInstance(
    args: ST.GetInstanceArgsSlack,
  ): Promise<SlackLogger> {
    const { APIToken, channelBots, internalLogs, teamId, onMemberError } = args;
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

    const members = new SlackMembers(
      client,
      auth.user_id ?? "",
      args,
      onMemberError,
    );

    const wanted = (channelBots ?? defaultBotChannels).map(
      (props: ST.SlackChannelProps) => ({
        props,
        name: this.buildChannelName(props),
        options: members.resolveOptions(props.slack),
      }),
    );
    const includePrivate = wanted.some((w) => w.options.private);

    const fetched = await this.fetchChannels(
      client,
      workspaceId,
      includePrivate,
      new Set(wanted.map((w) => w.name)),
    );
    const fetchedByName = new Map(fetched.map((f) => [f.channel.name, f]));

    for (const w of wanted) {
      const existing = fetchedByName.get(w.name);
      if (existing && w.options.syncMembers) {
        await this.syncExistingChannel(client, members, existing, w.options);
      }
    }

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
      fetched.map((f) => f.channel),
      {
        channels: wanted
          .filter((w) => !fetchedByName.has(w.name))
          .map((w) => w.props),
        groupId: workspaceId,
      },
      client,
      workspaceId,
      members,
      internalLogs,
    );
  }

  async createChannel(
    props: AT.CreateTextChannelProps,
  ): Promise<AT.TextChannel> {
    const options = this._members.resolveOptions(
      (props as ST.SlackChannelProps).slack,
    );
    const name = SlackLogger.buildChannelName(props);

    const { channel } = await this._clientInstance.conversations
      .create({ name, is_private: options.private })
      .catch((err) => {
        throw toSlackBotError(err);
      });

    if (!channel?.id) {
      throw new BotError(
        `O Slack não retornou o id do canal ${name}`,
        AT.BotErrorModules.Instance,
      );
    }

    if (props.description) {
      await this._clientInstance.conversations
        .setPurpose({ channel: channel.id, purpose: props.description })
        .catch(() =>
          this.internalLog(`Não foi possível definir a descrição de ${name}`),
        );
    }

    await this._members.ensureMembers(channel.id, name, options, true);

    return new SlackTextChannel(
      this._clientInstance,
      channel.id,
      name,
      utils.channelTypeResolve(name),
      this._teamId,
      props.description,
    );
  }

  private static buildChannelName(props: AT.CreateTextChannelProps): string {
    return sanitizeSlackChannelName(utils.generateChannelName(props));
  }

  /** Garante os membros de um canal que já existia antes deste start. */
  private static async syncExistingChannel(
    client: WebClient,
    members: SlackMembers,
    { channel, isMember, isPrivate }: FetchedChannel,
    options: ST.ResolvedSlackChannelOptions,
  ): Promise<void> {
    if (!isMember) {
      if (isPrivate) {
        members.report(
          new BotError(
            `O bot não está no canal privado #${channel.name}. Convide com /invite @seu-app.`,
            AT.BotErrorModules.Instance,
          ),
        );
        return;
      }

      try {
        await client.conversations.join({ channel: channel.id });
      } catch (err) {
        members.report(toSlackBotError(err), `Não foi possível entrar em #${channel.name}`);
        return;
      }
    }

    await members.ensureMembers(channel.id, channel.name, options, false);
  }

  private static async fetchChannels(
    client: WebClient,
    teamId: string,
    includePrivate: boolean,
    wantedNames: Set<string>,
  ): Promise<FetchedChannel[]> {
    const types = includePrivate
      ? "public_channel,private_channel"
      : "public_channel";
    const channels: FetchedChannel[] = [];

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

          channels.push({
            channel: new SlackTextChannel(
              client,
              ch.id,
              ch.name,
              utils.channelTypeResolve(ch.name),
              teamId,
              ch.purpose?.value,
            ),
            isMember: !!ch.is_member,
            isPrivate: !!ch.is_private,
          });
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
