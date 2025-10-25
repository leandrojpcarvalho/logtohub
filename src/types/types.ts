import { ChannelType } from "./index.js";

export type CreateTextChannelProps = {
  type: ChannelType;
  name: string;
  description?: string;
  isBot?: boolean;
};

export type CreationChannels = {
  channels: CreateTextChannelProps[];
  groupId?: string | number;
};

export type SendMessage = {
  message: LogLike;
  channel?:
    | {
        name: string;
      }
    | {
        type: string;
      }
    | string;
};

export type FindChannelsOptions = "name" | "type" | "any";

export type KeyType = string | symbol | number;
export type RecordType = Record<KeyType, unknown>;
export type LogLike = string | Array<LogLike> | RecordType;
