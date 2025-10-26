import { Channel } from "discord.js";
import { ChannelType } from "../types/enum.js";

export type DiscordChannel = Channel;

export type DiscordChannelAdapterProps = {
  discordChannel: DiscordChannel;
  type: ChannelType;
  env?: string;
};

export type DecodedNameInfo = {
  channelName: string;
  topic: string;
  env?: string;
};
