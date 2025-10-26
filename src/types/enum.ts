export enum ChannelType {
  BotError = "bot-error",
  BotNotification = "bot-notification",
  Common = "common",
}

export enum BotErrorModules {
  Instance = "[Instância]",
  Communication = "[Comunicação]",
}

export enum BotErrorMessage {
  DUPLICATED_CHANNEL = "Já existe um canal com esse nome",
  NOT_FOUND_CHANNEL = "O canal não foi encontrado",
}
