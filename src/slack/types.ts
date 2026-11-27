import { CreateTextChannelProps } from "../types";

export interface GetInstanceArgsSlack {
  APIToken: string;
  channelBots?: CreateTextChannelProps[];
  internalLogs?: boolean;
  teamId?: string;
  privateChannels?: boolean;
}
