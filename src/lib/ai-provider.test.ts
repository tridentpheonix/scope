import { afterEach, describe, expect, it } from "vitest";
import {
  getAiProviderLabel,
  readAiMessageContent,
  resolveAiProviderConfig,
} from "./ai-provider";

const envKeys = [
  "NVIDIA_API_BASE_URL",
  "NVIDIA_API_KEY",
  "NVIDIA_MODEL",
  "AI_API_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
] as const;

const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv[key];
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("resolveAiProviderConfig", () => {
  it("prefers NVIDIA env vars and defaults to the NVIDIA endpoint", () => {
    process.env.NVIDIA_API_KEY = "nvidia-key";
    process.env.NVIDIA_MODEL = "nvidia/llama-3.1-nemotron-70b-instruct";
    delete process.env.NVIDIA_API_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    delete process.env.AI_API_BASE_URL;

    const config = resolveAiProviderConfig();

    expect(config).toEqual({
      provider: "nvidia",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "nvidia-key",
      model: "nvidia/llama-3.1-nemotron-70b-instruct",
    });
  });

  it("still supports the legacy AI env vars as a fallback", () => {
    process.env.AI_API_KEY = "legacy-key";
    process.env.AI_MODEL = "gpt-test";
    delete process.env.NVIDIA_API_KEY;
    delete process.env.NVIDIA_MODEL;
    delete process.env.NVIDIA_API_BASE_URL;
    delete process.env.AI_API_BASE_URL;

    const config = resolveAiProviderConfig();

    expect(config).toEqual({
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "legacy-key",
      model: "gpt-test",
    });
  });
});

describe("readAiMessageContent", () => {
  it("reads reasoning content when regular content is empty", () => {
    expect(
      readAiMessageContent({
        content: "",
        reasoning_content: '{"ok":true}',
      }),
    ).toBe('{"ok":true}');
  });
});

describe("getAiProviderLabel", () => {
  it("formats provider labels for the UI", () => {
    expect(getAiProviderLabel("nvidia")).toBe("NVIDIA");
    expect(getAiProviderLabel("openai")).toBe("OpenAI");
    expect(getAiProviderLabel(null)).toBe("Fallback");
  });
});
