import { InternalChannelType } from "./enum.js";

export type ChannelTextCreation = {
  type: InternalChannelType;
  name: string;
  description?: string;
};

export type KeyType = string | symbol | number | any;
export type RecordType = Record<KeyType, unknown>;
