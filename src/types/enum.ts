export enum ChannelType {
  BotError = "BotError",
  BotNotification = "BotNotification",
  Common = "Common",
}

export enum BotErrorModules {
  Instance = "[Instância]",
  Communication = "[Comunicação]",
}

export enum BotErrorMessage {
  DUPLICATED_CHANNEL = "Já existe um canal com esse nome",
  NOT_FOUND_CHANNEL = "O canal não foi encontrado",
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};
