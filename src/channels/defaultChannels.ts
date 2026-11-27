import { ChannelType } from "@domain/enum.js";
import { CreateTextChannelProps } from "@domain/types.js";

const botCommunication: CreateTextChannelProps = {
  type: ChannelType.BotNotification,
  name: "Mensagens do bot",
  description: "Aqui estarão todos os eventos do bot",
};

const botCommunicationError: CreateTextChannelProps = {
  type: ChannelType.BotError,
  name: "mensagens de erro",
  description: "Aqui estarão todos os erros do bot",
};

export const defaultBotChannels = [botCommunication, botCommunicationError];
