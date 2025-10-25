import {
  ChannelType,
  CreateTextChannelProps,
  kebabToPascal,
  pascalToKebab,
} from "../index.js";

export function generateChannelName({ name, type }: CreateTextChannelProps) {
  const formattedType = pascalToKebab(type);
  const formattedName = pascalToKebab(name);

  return `${formattedType}-${formattedName}`;
}

export function decodeChannelByName(name: string) {
  const splitted = name.split("-");

  const channelDescribe =
    splitted[0] === "bot" ? splitted.slice(0, 2) : splitted.slice(0, 1);

  return {
    topic: kebabToPascal(channelDescribe.join("-")),
    channelName: kebabToPascal(splitted.join("-")),
  };
}

export function channelTypeResolve(name: string): ChannelType {
  const decoded = decodeChannelByName(name);

  const topic = decoded?.topic;

  if (!topic || !Object.values(ChannelType).includes(topic as ChannelType)) {
    return ChannelType.Common;
  }

  return topic as ChannelType;
}
