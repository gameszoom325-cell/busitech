import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const DEFAULT_OLLAMA_BASE_URL = "https://ollama.com";
export const DEFAULT_OLLAMA_MODEL = "gemma4:31b-cloud";

export const ALLOWED_OLLAMA_MODELS = [
  "gemma4:31b-cloud",
  "gemma4:27b",
  "llama3.3:70b",
  "mistral-large:latest",
];

/**
 * Resolves the Ollama Base URL and ensures proper '/v1' path for OpenAI SDK compatibility.
 */
export function resolveOllamaBaseUrl(): string {
  const raw = (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).trim();
  const clean = raw.replace(/\/+$/, "");
  return clean.endsWith("/v1") ? clean : `${clean}/v1`;
}

/**
 * Resolves and validates the server-side OLLAMA_API_KEY from environment variables.
 */
export function resolveOllamaApiKey(): string | null {
  const rawKey = (process.env.OLLAMA_API_KEY || "").trim();
  if (
    !rawKey ||
    rawKey === "PASTE_YOUR_API_KEY_HERE" ||
    rawKey === "your_ollama_api_key_here" ||
    rawKey === "your_ollama_cloud_api_key_here"
  ) {
    return null;
  }
  return rawKey;
}

/**
 * Returns true if a valid, non-placeholder OLLAMA_API_KEY is configured in the environment.
 */
export function hasValidOllamaApiKey(): boolean {
  return resolveOllamaApiKey() !== null;
}

/**
 * Resolves the active model identifier. Defaults to gemma4:31b-cloud.
 */
export function resolveOllamaModel(requestedModel?: string): string {
  const requested = (requestedModel || "").trim();
  if (requested && !requested.includes("gemini") && !requested.includes("deepseek")) {
    return requested;
  }
  return (process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL).trim();
}

let clientInstance: OpenAI | null = null;
let cachedApiKey: string | null = null;
let cachedBaseUrl: string | null = null;

/**
 * Returns an OpenAI SDK client configured for Ollama Cloud (or local Ollama).
 */
export function getOllamaClient(overrideApiKey?: string): OpenAI {
  const apiKey = (overrideApiKey || resolveOllamaApiKey() || "").trim();
  const baseURL = resolveOllamaBaseUrl();

  if (!apiKey) {
    const err = new Error(
      "Ollama API key is not configured. Please set OLLAMA_API_KEY in your .env file."
    ) as Error & { status?: number; code?: string };
    err.status = 401;
    err.code = "MISSING_API_KEY";
    throw err;
  }

  if (!clientInstance || cachedApiKey !== apiKey || cachedBaseUrl !== baseURL) {
    clientInstance = new OpenAI({
      baseURL,
      apiKey,
      defaultHeaders: {
        "User-Agent": "busitech-contract2action-ollama/1.0",
      },
    });
    cachedApiKey = apiKey;
    cachedBaseUrl = baseURL;
  }

  return clientInstance;
}

/**
 * Normalizes Ollama API errors into clean HTTP status codes and JSON messages.
 */
export function formatOllamaError(
  err: unknown,
  fallbackMessage = "Failed to process request with Ollama Cloud API."
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
        "Ollama Cloud API key is missing or invalid. Please check OLLAMA_API_KEY in your .env file.",
      status: 401,
      code: "MISSING_API_KEY",
    };
  }

  if (
    status === 429 ||
    rawMessage.toLowerCase().includes("rate limit") ||
    rawMessage.toLowerCase().includes("quota")
  ) {
    return {
      message:
        "Ollama Cloud rate limit reached. Please wait a moment and try again.",
      status: 429,
      code: "RATE_LIMITED",
    };
  }

  if (
    status === 404 ||
    rawMessage.toLowerCase().includes("model not found")
  ) {
    return {
      message: `Requested Ollama model (${resolveOllamaModel()}) was not found or is unavailable.`,
      status: 404,
      code: "MODEL_NOT_FOUND",
    };
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    rawMessage.toLowerCase().includes("econnrefused") ||
    rawMessage.toLowerCase().includes("fetch failed")
  ) {
    return {
      message: `Ollama endpoint (${resolveOllamaBaseUrl()}) is currently unreachable. Please check network connectivity and OLLAMA_BASE_URL.`,
      status: 503,
      code: "SERVICE_UNAVAILABLE",
    };
  }

  return {
    message:
      rawMessage && rawMessage.length < 200 ? rawMessage : fallbackMessage,
    status: status >= 400 && status < 600 ? status : 500,
    code: String(anyErr?.code || "OLLAMA_ERROR"),
  };
}
