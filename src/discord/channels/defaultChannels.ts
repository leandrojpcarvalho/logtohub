import { ChannelType } from "../../types/enum.js";
import { CreateTextChannelProps } from "../../types/types.js";

const botCommunication: CreateTextChannelProps = {
  type: ChannelType.BotNotification,
  name: "Mensagens do bot",
  description: "Aqui estarão todos os eventos do bot",
  botOnly: true,
};

const botCommunicationError: CreateTextChannelProps = {
  type: ChannelType.BotError,
  name: "mensagens de erro",
  description: "Aqui estarão todos os erros do bot",
  botOnly: true,
};

export const defaultBotChannels = [botCommunication, botCommunicationError];
