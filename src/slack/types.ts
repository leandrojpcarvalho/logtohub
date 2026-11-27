import { CreateTextChannelProps } from "@domain/index.js";

/**
 * Identifica um membro do workspace: o ID do usuário (`U0123ABCD`, `W0123ABCD`)
 * ou o e-mail dele (`dev@empresa.com`). E-mails exigem o scope `users:read.email`.
 */
export type SlackMember = string;

/**
 * Quem representa o "dono" do workspace nos canais criados pelo bot.
 * - `"primary"`: só o Primary Owner
 * - `"owners"`: todos os Owners
 * - `"admins"`: Owners e Admins
 * - `false`: ninguém
 *
 * Exige o scope `users:read`.
 */
export type SlackOwnerInvite = "primary" | "owners" | "admins" | false;

/**
 * O que fazer quando não for possível resolver ou convidar um membro
 * (e-mail inexistente, scope faltando, usuário convidado/guest etc.).
 * - `"warn"`: exibe um aviso no console e segue (padrão)
 * - `"throw"`: lança um BotError
 * - `"ignore"`: ignora em silêncio
 */
export type SlackMemberErrorMode = "warn" | "throw" | "ignore";

/**
 * Opções de visibilidade e membros. Podem ser definidas globalmente no
 * `getInstance` e sobrescritas por canal em `channelBots[].slack`.
 */
export interface SlackChannelOptions {
  /** Cria o canal como privado. Padrão: `privateChannels` do getInstance. */
  private?: boolean;
  /**
   * Membros convidados para o canal (IDs ou e-mails).
   * Os membros globais e os do canal são somados.
   */
  members?: SlackMember[];
  /** Convida todos os membros ativos do workspace (bots nunca entram). */
  everyone?: boolean;
  /** Inclui guests (convidados restritos) quando `everyone` está ativo. */
  includeGuests?: boolean;
  /** Quem do time de donos entra no canal. */
  inviteOwner?: SlackOwnerInvite;
  /**
   * Em canais que já existem, convida quem estiver faltando a cada start.
   * Útil para incluir pessoas que entraram no workspace depois.
   */
  syncMembers?: boolean;
}

/** Canal do Slack: as props comuns da lib + opções específicas do Slack. */
export type SlackChannelProps = CreateTextChannelProps & {
  slack?: SlackChannelOptions;
};

export interface GetInstanceArgsSlack {
  /** Bot User OAuth Token (`xoxb-...`). */
  APIToken: string;
  /** Canais a criar ou mapear. Padrão: canais de notificação e erro. */
  channelBots?: SlackChannelProps[];
  /** Exibe logs internos no console. */
  internalLogs?: boolean;
  /** Valida se o token pertence a esse workspace. */
  teamId?: string;
  /** Padrão de `private` para os canais. Padrão: `false` (públicos). */
  privateChannels?: boolean;
  /** Membros convidados para todos os canais (IDs ou e-mails). */
  members?: SlackMember[];
  /** Padrão de `everyone` para os canais. Padrão: `false`. */
  everyone?: boolean;
  /** Padrão de `includeGuests`. Padrão: `false`. */
  includeGuests?: boolean;
  /** Padrão de `inviteOwner`. Padrão: `"primary"`. */
  inviteOwner?: SlackOwnerInvite;
  /** Padrão de `syncMembers`. Padrão: `true`. */
  syncMembers?: boolean;
  /** O que fazer quando um convite falhar. Padrão: `"warn"`. */
  onMemberError?: SlackMemberErrorMode;
}

/** Opções do canal já combinadas com os padrões globais. */
export interface ResolvedSlackChannelOptions {
  private: boolean;
  members: SlackMember[];
  everyone: boolean;
  includeGuests: boolean;
  inviteOwner: SlackOwnerInvite;
  syncMembers: boolean;
}
