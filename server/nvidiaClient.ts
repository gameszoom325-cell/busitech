import OpenAI from "openai";

export const NVIDIA_MODEL = "deepseek-ai/deepseek-v4.1-flash";
export const ALLOWED_MODELS = [
  "deepseek-ai/deepseek-v4.1-flash",
  "deepseek-ai/deepseek-r1",
];

export function resolveNvidiaApiKey(): string | null {
  const rawKey = (process.env.NVIDIA_API_KEY || "").trim();
  if (!rawKey || rawKey === "your_nvidia_api_key_here") {
    return null;
  }
  return rawKey;
}

export function hasValidNvidiaApiKey(): boolean {
  return resolveNvidiaApiKey() !== null;
}

export function getNvidiaClient(overrideApiKey?: string): OpenAI {
  const apiKey = (overrideApiKey || resolveNvidiaApiKey() || "").trim();
  if (!apiKey) {
    const err = new Error(
      "NVIDIA API key is not configured. Please add NVIDIA_API_KEY in Vercel Project Settings > Environment Variables."
    ) as Error & { status?: number; code?: string };
    err.status = 401;
    err.code = "MISSING_API_KEY";
    throw err;
  }

  return new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey,
  });
}

export function formatNvidiaError(
  err: unknown,
  fallbackMessage: string
): { message: string; status: number; code: string } {
  const anyErr = err as {
    status?: number;
    code?: string | number;
    message?: string;
    error?: { message?: string; code?: string };
  };

  const status = typeof anyErr?.status === "number" ? anyErr.status : 500;
  const rawMessage = anyErr?.error?.message || anyErr?.message || "";

  if (anyErr?.code === "MISSING_API_KEY" || status === 401) {
    return {
      message:
        "NVIDIA API key is not configured. Please add NVIDIA_API_KEY in Vercel Project Settings > Environment Variables.",
      status: 401,
      code: "MISSING_API_KEY",
    };
  }

  if (status === 429) {
    return {
      message:
        "NVIDIA DeepSeek rate limit reached. Please wait a moment and try again.",
      status: 429,
      code: "RATE_LIMITED",
    };
  }

  if (status === 404) {
    return {
      message: "AI service endpoint was not found (HTTP 404).",
      status: 404,
      code: "NOT_FOUND",
    };
  }

  return {
    message:
      rawMessage && rawMessage.length < 150 ? rawMessage : fallbackMessage,
    status: status >= 400 && status < 600 ? status : 500,
    code: String(anyErr?.code || "AI_ERROR"),
  };
}
