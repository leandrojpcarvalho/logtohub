import { WebAPIPlatformError } from "@slack/web-api";
import { BotErrorModules } from "../types";
import friendlyMessages from "./friendlyMessages";
import { BotError } from "../utils";

const SLACK_CHANNEL_NAME_MAX = 80;

export function sanitizeSlackChannelName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-") // caracteres inválidos viram hífen
    .replace(/-+/g, "-") // junta hífens repetidos
    .replace(/^-|-$/g, "") // tira hífen das pontas
    .slice(0, SLACK_CHANNEL_NAME_MAX);
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
