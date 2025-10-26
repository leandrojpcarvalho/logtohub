import { ChannelType } from "./index.js";

export type CreateTextChannelProps = {
  type: ChannelType;
  name: string;
  description?: string;
  botOnly?: boolean;
  env?: string;
};

export type CreationChannels<T extends string[] = string[]> = {
  channels: CreateTextChannelProps[];
  groupId?: string | number;
  env?: Environment<T>;
};

export type Environment<T extends string[]> = T | EnvironmentProps<T>;

export type EnvironmentProps<T extends string[]> = {
  env: T;
  ignoredChannelsByEnv: Record<T[number], string[]>;
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
