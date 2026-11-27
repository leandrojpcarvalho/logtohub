import {
  ConversationsInviteResponse,
  ConversationsMembersResponse,
  UsersListResponse,
  WebClient,
} from "@slack/web-api";
import { BotErrorModules } from "@domain/index.js";
import { BotError } from "@utils/index.js";
import {
  GetInstanceArgsSlack,
  ResolvedSlackChannelOptions,
  SlackChannelOptions,
  SlackMember,
  SlackMemberErrorMode,
  SlackOwnerInvite,
} from "./types.js";
import { getSlackErrorCode, toSlackBotError } from "./utils.js";

type Member = NonNullable<UsersListResponse["members"]>[number];

const SLACK_PAGE_LIMIT = 200;
const INVITE_BATCH_LIMIT = 1000;
const SLACKBOT_ID = "USLACKBOT";
const USER_ID_PATTERN = /^[UW][A-Z0-9]{2,}$/;

/**
 * Resolve e convida membros para os canais criados ou mapeados pelo SlackLogger.
 *
 * As chamadas a `users.list` e `users.lookupByEmail` são feitas sob demanda e
 * ficam em cache durante a vida da instância, então só custam algo quando
 * as opções `everyone`, `inviteOwner` ou membros por e-mail são usadas.
 */
export class SlackMembers {
  private usersCache?: Promise<Member[]>;
  private emailCache = new Map<string, Promise<string | null>>();

  constructor(
    private readonly client: WebClient,
    private readonly botUserId: string,
    private readonly defaults: GetInstanceArgsSlack,
    private readonly onError: SlackMemberErrorMode = "warn",
  ) {}

  /** Combina as opções do canal com os padrões globais do getInstance. */
  public resolveOptions(
    options?: SlackChannelOptions,
  ): ResolvedSlackChannelOptions {
    const d = this.defaults;

    return {
      private: options?.private ?? d.privateChannels ?? false,
      members: [...(d.members ?? []), ...(options?.members ?? [])],
      everyone: options?.everyone ?? d.everyone ?? false,
      includeGuests: options?.includeGuests ?? d.includeGuests ?? false,
      inviteOwner: options?.inviteOwner ?? d.inviteOwner ?? "primary",
      syncMembers: options?.syncMembers ?? d.syncMembers ?? true,
    };
  }

  /** IDs de todos que deveriam estar no canal (sem o próprio bot). */
  public async desiredMembers(
    options: ResolvedSlackChannelOptions,
  ): Promise<string[]> {
    const ids = new Set<string>();

    if (options.everyone) {
      for (const user of await this.activeUsers(options.includeGuests)) {
        ids.add(user.id!);
      }
    }

    for (const id of await this.owners(options.inviteOwner)) ids.add(id);

    const resolved = await Promise.all(
      options.members.map((member) => this.resolveMember(member)),
    );
    for (const id of resolved) if (id) ids.add(id);

    ids.delete(this.botUserId);
    return [...ids];
  }

  /**
   * Convida para o canal quem estiver faltando.
   * @param freshChannel true quando o canal acabou de ser criado (só o bot está nele)
   */
  public async ensureMembers(
    channelId: string,
    channelName: string,
    options: ResolvedSlackChannelOptions,
    freshChannel: boolean,
  ): Promise<void> {
    const desired = await this.desiredMembers(options);
    if (desired.length === 0) return;

    const current = freshChannel
      ? new Set([this.botUserId])
      : await this.channelMembers(channelId);
    const missing = desired.filter((id) => !current.has(id));
    if (missing.length === 0) return;

    for (let i = 0; i < missing.length; i += INVITE_BATCH_LIMIT) {
      const batch = missing.slice(i, i + INVITE_BATCH_LIMIT);

      try {
        const res = (await this.client.conversations.invite({
          channel: channelId,
          users: batch.join(","),
          force: true,
        })) as ConversationsInviteResponse;

        for (const failure of res.errors ?? []) {
          if (failure.error === "already_in_channel") continue;
          this.report(
            new BotError(
              `Não foi possível convidar ${failure.user} para #${channelName}: ${failure.error}`,
              BotErrorModules.Instance,
            ),
          );
        }
      } catch (err) {
        if (getSlackErrorCode(err) === "already_in_channel") continue;
        this.report(
          toSlackBotError(err),
          `Falha ao convidar membros para #${channelName}`,
        );
      }
    }
  }

  private async resolveMember(member: SlackMember): Promise<string | null> {
    const value = member.trim();
    if (USER_ID_PATTERN.test(value)) return value;

    if (!value.includes("@")) {
      this.report(
        new BotError(
          `Membro inválido "${value}": use o ID do usuário (U...) ou o e-mail.`,
          BotErrorModules.Instance,
        ),
      );
      return null;
    }

    const email = value.toLowerCase();
    let pending = this.emailCache.get(email);
    if (!pending) {
      pending = this.lookupEmail(email);
      this.emailCache.set(email, pending);
    }
    return pending;
  }

  private async lookupEmail(email: string): Promise<string | null> {
    try {
      const res = await this.client.users.lookupByEmail({ email });
      return res.user?.id ?? null;
    } catch (err) {
      this.report(toSlackBotError(err), `E-mail ${email}`);
      return null;
    }
  }

  private async owners(mode: SlackOwnerInvite): Promise<string[]> {
    if (!mode) return [];

    const users = await this.activeUsers(true);
    const match: Record<
      Exclude<SlackOwnerInvite, false>,
      (u: Member) => boolean
    > = {
      primary: (u) => !!u.is_primary_owner,
      owners: (u) => !!u.is_owner,
      admins: (u) => !!(u.is_owner || u.is_admin),
    };

    return users.filter(match[mode]).map((u) => u.id!);
  }

  private async activeUsers(includeGuests: boolean): Promise<Member[]> {
    const users = await this.allUsers();

    return users.filter(
      (u) => includeGuests || (!u.is_restricted && !u.is_ultra_restricted),
    );
  }

  private allUsers(): Promise<Member[]> {
    if (!this.usersCache) {
      this.usersCache = this.fetchUsers().catch((err) => {
        this.usersCache = undefined;
        this.report(
          toSlackBotError(err),
          "Não foi possível listar os usuários",
        );
        return [];
      });
    }
    return this.usersCache;
  }

  private async fetchUsers(): Promise<Member[]> {
    const users: Member[] = [];
    const pages = this.client.paginate("users.list", {
      limit: SLACK_PAGE_LIMIT,
    });

    for await (const page of pages) {
      for (const user of (page as UsersListResponse).members ?? []) {
        if (
          !user.id ||
          user.deleted ||
          user.is_bot ||
          user.is_app_user ||
          user.id === SLACKBOT_ID
        )
          continue;
        users.push(user);
      }
    }
    return users;
  }

  private async channelMembers(channelId: string): Promise<Set<string>> {
    const members = new Set<string>();

    try {
      const pages = this.client.paginate("conversations.members", {
        channel: channelId,
        limit: SLACK_PAGE_LIMIT,
      });
      for await (const page of pages) {
        for (const id of (page as ConversationsMembersResponse).members ?? []) {
          members.add(id);
        }
      }
    } catch (err) {
      this.report(
        toSlackBotError(err),
        "Não foi possível listar os membros do canal",
      );
    }
    return members;
  }

  public report(error: BotError, context?: string): void {
    if (this.onError === "ignore") return;
    if (this.onError === "throw") throw error;

    console.warn(
      `[logtohub/slack] ${context ? `${context}: ` : ""}${error.message}`,
    );
  }
}
