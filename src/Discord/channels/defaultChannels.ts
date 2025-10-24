import { InternalChannelType } from "../../types/enum.js";
import { ChannelTextCreation } from "../../types/types.js";

export const botCommunication: ChannelTextCreation = {
  type: InternalChannelType.BotNotification,
  name: "Mensagens do bot",
  description: "Aqui estarão todos os eventos do bot",
};

export const botCommunicationError: ChannelTextCreation = {
  type: InternalChannelType.BotError,
  name: "mensagens de erro",
  description: "Aqui estarão todos os erros do bot",
};