export function serializeJson(value: unknown) {
  if (typeof value === "undefined") {
    return null;
  }

  return JSON.stringify(value);
}

export function parseJson<T>(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
}
