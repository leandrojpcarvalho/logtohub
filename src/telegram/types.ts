import { CreateTextChannelProps, LogLevel } from "../types";

export interface GetInstanceArgsTelegram {
  APIToken: string;
  channelBots?: CreateTextChannelProps[];
  internalLogs?: boolean;
  guildId: string;
  memoryFilePath?: string;
  memory?: TelegramMemory;
  minLogLevel?: LogLevel;
}

export interface InternalForumTopic {
  messageThreadId: number;
  name: string;
}

export interface TelegramMemory {
  addTopic(topicName: string, topicId: number): Promise<void>;
  getAllTopics(): Promise<Record<number, string>>;
  getTopicIdByName(topicName: string): Promise<number | null>;
  removeTopic(topicId: number): Promise<void>;
  clearTopics(): Promise<void>;
}
