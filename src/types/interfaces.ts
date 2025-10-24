import { ClientOptions } from "discord.js";
import { ChannelTextCreation, InternalChannelType } from "../Discord/index.js";

export enum Platforms {
  DISCORD = "discord",
}

export interface Channel {
  name: string;
  type: InternalChannelType;
  description?: string | null;
  groupId?: string | number;

  sendMessage(message: unknown): Promise<void>;
}

export interface Platform {
  allChannels: Map<string, Channel>;
  platform: Platforms;

  getChannel(channelName: string): Channel | null;
  createChannel(
    textChannelProps: ChannelTextCreation,
    groupId?: string,
    isBot?: boolean
  ): Promise<Channel>;
  start(): Promise<void>;
}

export interface PlatformDiscordConstructor {
  APIToken: string;
  options?: ClientOptions;
  defaultChannelBots?: ChannelTextCreation[];
}

//TODO: Implement chat on channels to execute pre-set commands
