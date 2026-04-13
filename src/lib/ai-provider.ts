export type AiProviderName = "nvidia" | "openai";

export type AiProviderConfig = {
  provider: AiProviderName;
  baseUrl: string;
  apiKey: string;
  model: string;
};

type AiMessageContent = {
  content?: unknown;
  reasoning_content?: unknown;
};

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function hasConfiguredNvidiaEnv() {
  return Boolean(readEnv("NVIDIA_API_KEY") || readEnv("NVIDIA_MODEL"));
}

function hasConfiguredLegacyAiEnv() {
  return Boolean(readEnv("AI_API_KEY") || readEnv("AI_MODEL"));
}

export function resolveAiProviderConfig(
  overrides?: Partial<AiProviderConfig> | null,
): AiProviderConfig | null {
  const overrideProvider = overrides?.provider ?? null;
  const overrideLooksNvidia = Boolean(
    overrides?.baseUrl && overrides.baseUrl.includes("nvidia"),
  );
  const envProvider: AiProviderName | null = hasConfiguredNvidiaEnv()
    ? "nvidia"
    : hasConfiguredLegacyAiEnv()
      ? "openai"
      : null;

  const provider = overrideProvider ?? envProvider ?? (overrideLooksNvidia ? "nvidia" : null) ?? (
    overrides?.apiKey || overrides?.model || overrides?.baseUrl ? "openai" : null
  );
  if (!provider) {
    return null;
  }

  const baseUrl =
    overrides?.baseUrl ??
    (provider === "nvidia"
      ? readEnv("NVIDIA_API_BASE_URL") ?? readEnv("AI_API_BASE_URL") ?? "https://integrate.api.nvidia.com/v1"
      : readEnv("AI_API_BASE_URL") ?? readEnv("NVIDIA_API_BASE_URL") ?? "https://api.openai.com/v1");

  const apiKey =
    overrides?.apiKey ??
    (provider === "nvidia"
      ? readEnv("NVIDIA_API_KEY") ?? readEnv("AI_API_KEY")
      : readEnv("AI_API_KEY") ?? readEnv("NVIDIA_API_KEY")) ??
    null;

  const model =
    overrides?.model ??
    (provider === "nvidia"
      ? readEnv("NVIDIA_MODEL") ?? readEnv("AI_MODEL")
      : readEnv("AI_MODEL") ?? readEnv("NVIDIA_MODEL")) ??
    null;

  if (!apiKey || !model) {
    return null;
  }

  return {
    provider,
    baseUrl,
    apiKey,
    model,
  };
}

export function readAiMessageContent(message: AiMessageContent | null | undefined) {
  const candidates = [message?.content, message?.reasoning_content];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      if (candidate.trim().length > 0) {
        return candidate;
      }

      continue;
    }

    if (Array.isArray(candidate)) {
      const text = candidate
        .map((part) => {
          if (!part || typeof part !== "object") {
            return "";
          }

          const typedPart = part as { text?: unknown };
          return typeof typedPart.text === "string" ? typedPart.text : "";
        })
        .join("");

      if (text.trim().length > 0) {
        return text;
      }
    }
  }

  return "";
}

export function getAiProviderLabel(provider: AiProviderName | null) {
  switch (provider) {
    case "nvidia":
      return "NVIDIA";
    case "openai":
      return "OpenAI";
    default:
      return "Fallback";
  }
}
