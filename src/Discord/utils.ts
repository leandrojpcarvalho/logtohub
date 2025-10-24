export function kebabToPascal(str: string) {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
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
