import { CreateTextChannelProps } from "../types";

export interface GetInstanceArgsTelegram {
  APIToken: string;
  prettifyLogs?: boolean;
  channelBots?: CreateTextChannelProps[];
  internalLogs?: boolean;
  guildId: string;
  memoryFilePath?: string;
  memory?: TelegramMemory;
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
