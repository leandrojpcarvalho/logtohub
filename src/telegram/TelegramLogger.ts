import { Bot } from "grammy";
import { Logger } from "../AbstractLogger";
import * as AT from "../types";
import * as TT from "./types";
import { TelegramLocalMemory } from "./TelegramLocalMemory";
import * as utils from "../utils";
import { BotError } from "../utils";
import { TelegramTextChannel } from "./TelegramTextChannel";
import { defaultBotChannels } from "../discord";


/**
 * TelegramLogger implementation for logging messages to Telegram channels.
 * 
 * This class extends the abstract Logger class to provide Telegram-specific functionality
 * for creating and managing text channels within Telegram groups using forum topics.
 * 
 * **Important Note about Local Memory File:**
 * The TelegramLogger uses a local memory file to maintain mappings between channel names
 * and Telegram topic IDs. If this file is deleted or corrupted:
 * - All existing channel mappings will be lost
 * - The bot will attempt to recreate channels that already exist
 * - This may result in duplicate channels/topics in your Telegram group
 * - Manual cleanup may be required to remove duplicated topics
 * 
 * To prevent data loss, ensure the memory file is backed up and not accidentally deleted.
 * 
 * Custom memory storage (Redis/DB)
 * --------------------------------
 * By default, `TelegramLogger` uses a local file-based storage implemented by
 * `TelegramLocalMemory`. If you want to change how data is persisted (e.g., use
 * Redis, Postgres, MongoDB), provide your own implementation of the
 * `TelegramMemory` interface and pass it via the `memory` parameter in
 * `getInstance`.
 * 
 * Minimal interface to implement:
 * ```ts
 * export interface TelegramMemory {
 *   addTopic(topicName: string, topicId: number): Promise<void>;
 *   getAllTopics(): Promise<Record<number, string>>;
 *   getTopicIdByName(topicName: string): Promise<number | null>;
 *   removeTopic(topicId: number): Promise<void>;
 *   clearTopics(): Promise<void>;
 * }
 * ```
 * 
 * Example usage with a custom implementation (e.g., Redis):
 * ```ts
 * const logger = await TelegramLogger.getInstance({
 *   APIToken: 'your-bot-token',
 *   guildId: 'your-group-id',
 *   memory: new RedisTelegramMemory(redisClient), // your implementation
 *   internalLogs: true,
 * });
 * ```
 * 
 * @example
 * ```typescript
 * const logger = await TelegramLogger.getInstance({
 *   APIToken: 'your-bot-token',
 *   guildId: 'your-group-id',
 *   internalLogs: true,
 *   channelBots: [
 *     { name: 'general', description: 'General logging' },
 *     { name: 'errors', description: 'Error logging' }
 *   ]
 * });
 * ```
 */
export class TelegramLogger extends Logger {
  private _clientInstance: Bot;
  private _memory: TT.TelegramMemory;

  private constructor(
    existingChannels: AT.TextChannel[],
    channelsToCreate: AT.CreationChannels,
    client: Bot,
    memory: TT.TelegramMemory,
    internalLogs?: boolean,
    prettifyLogs?: boolean // TODO: implementar após https://github.com/leandrojpcarvalho/logtohub/pull/488
  ) {
    super(AT.Platforms.TELEGRAM, existingChannels, internalLogs);
    this._clientInstance = client;
    this._memory = memory;
    this.processChannels(channelsToCreate);
  }

  static async getInstance({
    APIToken,
    internalLogs,
    channelBots,
    guildId,
    memory: externalMemory,
    memoryFilePath,
    prettifyLogs,
  }: TT.GetInstanceArgsTelegram): Promise<TelegramLogger> {
    const memory = externalMemory ? externalMemory : new TelegramLocalMemory(memoryFilePath);
    const bot = new Bot(APIToken);

    await bot.init();
    const chat = await bot.api.getChat(guildId);
    const admins = await bot.api.getChatAdministrators(guildId);
    const botIsAdmin = admins.find(admin => admin.user.id === bot.botInfo.id);

    if (!botIsAdmin) {
      throw new BotError(
        "O bot precisa ser administrador do grupo para gerenciar tópicos. Por favor, promova o bot a administrador nas configurações do grupo.",
        AT.BotErrorModules.Instance
      );
    }

    if (!chat.is_forum) {
      throw new BotError(
        "Este grupo não tem tópicos habilitados. Ative 'Topics' nas configurações do Telegram e permita que o bot crie tópicos.",
        AT.BotErrorModules.Instance
      );
    }
    
    const memoryTopics = await memory.getAllTopics()
    const existingChannels: AT.TextChannel[] = [];
    const channelsToCreate: AT.CreateTextChannelProps[] = [];

    for (const [topicIdStr, topicName] of Object.entries(memoryTopics)) {
      const topicId = Number(topicIdStr);

      const topicExists = await this.verifyIfTopicExists(bot, topicId, guildId);

      if (topicExists) {
        existingChannels.push(this.convertTopicToTextChannel(bot, topicId, topicName, guildId));
      } else {
        await memory.removeTopic(topicId);
        channelsToCreate.push({
          name: topicName,
          type: utils.channelTypeResolve(topicName),
        });
      }
    }

    for (const channelBot of channelBots ?? []) {
      const isMappedChannel = existingChannels.find((ch) => ch.name === channelBot.name);
      if (!isMappedChannel) {
        channelsToCreate.push(channelBot);
      }
    }

    console.log(utils.trimText(`
      ────────────────────────────────────────────
      🤖  Bot conectado com sucesso!
      🪪  Usuário: ${bot.botInfo.first_name}
      🌐  Guilda: ${guildId}
      ────────────────────────────────────────────
    `));

    return new TelegramLogger(
      existingChannels,
      {
        channels: channelsToCreate ?? defaultBotChannels,
        groupId: guildId
      },
      bot,
      memory,
      internalLogs,
      prettifyLogs
    );
  }

  async createChannel(
    options: AT.CreateTextChannelProps,
    groupId?: string
  ): Promise<AT.TextChannel> {
    if (!groupId) {
      throw new BotError("Guild ID é obrigatório para criar um canal no Telegram", AT.BotErrorModules.Instance);
    }

    const topic = await this._clientInstance.api.createForumTopic(String(groupId), options.name);
    await this._memory.addTopic(options.name, topic.message_thread_id);

    return new TelegramTextChannel(
      this._clientInstance,
      { messageThreadId: topic.message_thread_id, name: options.name },
      options.type,
      groupId,
      options.description
    )
  }

  private static convertTopicToTextChannel(client: Bot, topicId: number, topicName: string, groupId: string): AT.TextChannel {
    return new TelegramTextChannel(
      client,
      { messageThreadId: topicId, name: topicName },
      utils.channelTypeResolve(topicName),
      groupId
    )
  }

  private static async verifyIfTopicExists(client: Bot, topicId: number, groupId: string): Promise<boolean> {
    try {
      const msg = await client.api.sendMessage(groupId, "[LogToHub] mapeando tópico...", {
        message_thread_id: topicId,
        disable_notification: true,
      });

      await client.api.deleteMessage(groupId, msg.message_id);
      return true;
    } catch (e) {
      return false;
    }
  }
}
