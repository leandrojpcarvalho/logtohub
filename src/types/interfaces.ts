import { ClientOptions } from "discord.js";

import {
  ChannelType,
  CreateTextChannelProps,
  LogLike,
  SendMessage,
} from "../index.js";

export enum Platforms {
  DISCORD = "discord",
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

export interface VoiceChannel extends Channel {}
export interface TextChannel extends Channel {
  description?: string | null;
  groupId?: string | number;
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
}

export interface PlatformDiscordConstructor {
  APIToken: string;
  options?: ClientOptions;
  channelBots?: CreateTextChannelProps[];
  internalLogs?: boolean;
}

//TODO: Implement chat on channels to execute pre-set commands
