import { BotErrorModules } from "../index.js";

export class BotError extends Error {
  constructor(message: string, module: BotErrorModules) {
    super(module.concat(" - ", message));
  }
}
