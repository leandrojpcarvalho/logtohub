import { ChannelType, CreateTextChannelProps } from "../types";

function capitalizeFirstLetter(
  str: string[] | string,
  separator: "-" | " " = " "
) {
  const splitted = Array.isArray(str) ? str : str.split(separator);

  return splitted.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export function kebabToPascal(str: string) {
  return capitalizeFirstLetter(str, "-").join("");
}

export function pascalToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function convertDataToString(obj: unknown): string {
  if (obj === undefined || obj === null) {
    return "";
  }

  if (typeof obj === "string") {
    return obj;
  }

  return "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
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

export function generateChannelName({ name, type }: CreateTextChannelProps) {
  const formattedType = pascalToKebab(type);
  const formattedName = pascalToKebab(name.split(" ").join("-"));

  return `${formattedType}-${formattedName}`;
}

export function trimText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
