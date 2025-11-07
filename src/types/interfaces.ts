import { ClientOptions } from "discord.js";

import {
  ChannelType,
  CreateTextChannelProps,
  LogLike,
  SendMessage,
} from "../index.js";

export enum Platforms {
  DISCORD = "discord",
  TELEGRAM = "telegram",
}

export enum Status {
  UPDATING = "updating",
  READY = "ready",
  CREATING = "creating",
}

export interface Channel {
  name: string;
  type: ChannelType;

  sendMessage(message: LogLike): Promise<void>;
}

export interface VoiceChannel extends Channel {
  /**
   * Sends a message to the channel
   * @param message The message to be sent
   * @param prettifyLogs Whether to prettify the logs or not
  */
  sendMessage(message: LogLike, prettifyLogs?: boolean): Promise<void>;
}

export interface TextChannel extends Channel {
  description?: string | null;
  groupId?: string | number;

  /**
   * Sends a message to the channel
   * @param message The message to be sent
   * @param prettifyLogs Whether to prettify the logs or not
  */
  sendMessage(message: LogLike, prettifyLogs?: boolean): Promise<void>;
}

export interface Platform {
  allChannels: Map<string, TextChannel>;
  platform: Platforms;
  status: Status;

  getChannel(channelName: string): TextChannel | null;
  createChannel(
    textChannelProps: CreateTextChannelProps,
    groupId?: string,
    isBot?: boolean
  ): Promise<TextChannel>;
  log(messageToSend: SendMessage): Promise<void>;
  awaitReady(): Promise<void>;
}

export interface PlatformDiscordConstructor {
  APIToken: string;
  options?: ClientOptions;
  channelBots?: CreateTextChannelProps[];
  internalLogs?: boolean;
  guildId?: string;
  prettifyLogs?: boolean;
}

//TODO: Implement chat on channels to execute pre-set commands
