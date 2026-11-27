import { WebAPIPlatformError } from "@slack/web-api";
import { BotErrorModules, LogLike } from "@domain/index.js";
import friendlyMessages from "./friendlyMessages.js";
import { BotError } from "@utils/index.js";

const SLACK_CHANNEL_NAME_MAX = 80;
const CODE_FENCE = "```";

export const SLACK_TEXT_LIMIT = 4000;
export const TRUNCATED_SUFFIX = "\n…(mensagem truncada)";

export function sanitizeSlackChannelName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-") // caracteres inválidos viram hífen
    .replace(/-+/g, "-") // junta hífens repetidos
    .replace(/^-|-$/g, "") // tira hífen das pontas
    .slice(0, SLACK_CHANNEL_NAME_MAX)
    .replace(/-$/, ""); // o corte pode deixar um hífen no final
}

/**
 * Converte o log para o mrkdwn do Slack. Objetos e arrays viram um bloco de
 * código sem a tag de linguagem, pois o Slack exibiria "json" como texto.
 */
export function formatSlackMessage(message: LogLike): string {
  if (message === undefined || message === null) return "";
  if (typeof message === "string") return message;

  return `${CODE_FENCE}\n${JSON.stringify(message, null, 2)}\n${CODE_FENCE}`;
}

/**
 * Trunca o texto no limite do Slack sem deixar bloco de código aberto
 * nem partir um caractere fora do BMP (ex.: emoji) ao meio.
 */
export function truncateSlackText(
  text: string,
  limit = SLACK_TEXT_LIMIT,
): string {
  if (text.length <= limit) return text;

  // reserva espaço para um possível fechamento de bloco
  const closing = `\n${CODE_FENCE}`;
  let cut = text.slice(0, limit - TRUNCATED_SUFFIX.length - closing.length);

  const lastCode = cut.charCodeAt(cut.length - 1);
  if (lastCode >= 0xd800 && lastCode <= 0xdbff) cut = cut.slice(0, -1);

  const openFences = cut.split(CODE_FENCE).length - 1;
  if (openFences % 2 !== 0) cut += closing;

  return cut + TRUNCATED_SUFFIX;
}

export function getSlackErrorCode(err: unknown): string | null {
  return err instanceof WebAPIPlatformError ? err.data.error : null;
}

export function toSlackBotError(
  err: unknown,
  module = BotErrorModules.Instance,
): BotError {
  const code = getSlackErrorCode(err);

  if (code)
    return new BotError(
      friendlyMessages[code] ?? `Erro do Slack: ${code}`,
      module,
    );

  return new BotError(err instanceof Error ? err.message : String(err), module);
}
