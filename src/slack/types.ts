import { CreateTextChannelProps } from "@domain/index.js";

export interface GetInstanceArgsSlack {
  APIToken: string;
  channelBots?: CreateTextChannelProps[];
  internalLogs?: boolean;
  teamId?: string;
  privateChannels?: boolean;
}
