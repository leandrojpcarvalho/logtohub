import { CreateTextChannelProps } from "../types/index.js";

export interface GetInstanceArgsSlack {
  APIToken: string;
  channelBots?: CreateTextChannelProps[];
  internalLogs?: boolean;
  teamId?: string;
  privateChannels?: boolean;
}
