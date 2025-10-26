import {
  ChannelType,
  CreateTextChannelProps,
  kebabToPascal,
  pascalToKebab,
} from "../index.js";
import { DecodedNameInfo } from "./type.js";

export function generateChannelName({
  name,
  type,
  env,
}: CreateTextChannelProps) {
  const formattedType = pascalToKebab(type);
  const formattedName = pascalToKebab(name);

  const formattedStage = env ? `_${env}¬__` : "";

  return `${formattedStage}${formattedType}__${formattedName}`;
}

export function decodeChannelByName(name: string): DecodedNameInfo {
  const envSplit = name.split("¬__");
  const env = envSplit.length > 1 ? envSplit[0].replace("_", "") : undefined;

  const splitted = (env ? envSplit[1] : name).split("-");

  const channelDescribe =
    splitted[0].toLowerCase() === "bot"
      ? splitted.slice(0, 2)
      : splitted.slice(0, 1);

  const topic = channelDescribe.join("-").split("__")[0];
  return {
    env,
    topic,
    channelName: kebabToPascal(splitted.join("-")),
  };
}

export function channelTypeResolve(topic?: string): ChannelType {
  if (topic && Object.values(ChannelType).includes(topic as ChannelType)) {
    return topic as ChannelType;
  }
  return ChannelType.Common;
}
