import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const GEMINI_PRO_MODEL = "gemini-4-argon";
export const GEMINI_FLASH_MODEL = "gemini-3.8-flash";
export const GEMINI_FLASH_LITE_MODEL = "gemini-3.1-flash-lite";

export type SupportedGeminiModel =
  | typeof GEMINI_PRO_MODEL
  | typeof GEMINI_FLASH_MODEL
  | typeof GEMINI_FLASH_LITE_MODEL;

export const ALLOWED_GEMINI_MODELS: SupportedGeminiModel[] = [
  GEMINI_PRO_MODEL,
  GEMINI_FLASH_MODEL,
  GEMINI_FLASH_LITE_MODEL,
];

let aiInstance: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

/**
 * Resolves and validates the server-side GEMINI_API_KEY from environment variables.
 */
export function resolveGeminiApiKey(): string | null {
  const rawKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!rawKey || rawKey === "your_gemini_api_key_here") {
    return null;
  }
  return rawKey;
}

/**
 * Returns true if a non-placeholder GEMINI_API_KEY is configured in the environment.
 */
export function hasValidGeminiApiKey(): boolean {
  return resolveGeminiApiKey() !== null;
}

/**
 * Shared server-side Gemini API client for Busitech / Contract2Action AI.
 * Always runs on the server and includes the required 'aistudio-build' User-Agent header.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    const missingKeyError = new Error(
      "Missing Gemini API Key: GEMINI_API_KEY is not configured or is still set to the placeholder value. Please set GEMINI_API_KEY in your .env file or in the Settings > Secrets panel and restart the server."
    ) as Error & { status?: number; code?: string };
    missingKeyError.status = 401;
    missingKeyError.code = "MISSING_API_KEY";
    throw missingKeyError;
  }

  if (!aiInstance || cachedApiKey !== apiKey) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    cachedApiKey = apiKey;
  }

  return aiInstance;
}

/**
 * Normalizes Gemini SDK and network errors into clear, actionable HTTP status codes and messages.
 */
export function formatGeminiError(
  err: unknown,
  fallbackContext = "Gemini API request failed"
): { status: number; code: string; message: string } {
  const anyErr = err as {
    status?: number;
    code?: string;
    message?: string;
    error?: { code?: number; message?: string; status?: string };
  };

  const rawMessage =
    anyErr?.error?.message ||
    anyErr?.message ||
    (typeof err === "string" ? err : "") ||
    fallbackContext;

  const statusFromErr =
    typeof anyErr?.status === "number"
      ? anyErr.status
      : typeof anyErr?.error?.code === "number"
      ? anyErr.error.code
      : 500;

  if (
    anyErr?.code === "MISSING_API_KEY" ||
    rawMessage.includes("GEMINI_API_KEY is not configured")
  ) {
    return {
      status: 401,
      code: "MISSING_API_KEY",
      message:
        "Missing Gemini API Key: GEMINI_API_KEY is not configured. Add GEMINI_API_KEY to your .env file (or Settings > Secrets) and restart the server.",
    };
  }

  if (
    anyErr?.code === "INVALID_GEMINI_RESPONSE" ||
    rawMessage.includes("Invalid response received from Gemini")
  ) {
    return {
      status: 502,
      code: "INVALID_GEMINI_RESPONSE",
      message: rawMessage,
    };
  }

  if (
    statusFromErr === 400 &&
    (rawMessage.includes("API_KEY_INVALID") ||
      rawMessage.toLowerCase().includes("api key not valid"))
  ) {
    return {
      status: 401,
      code: "API_KEY_INVALID",
      message:
        "Gemini API request failed: The configured GEMINI_API_KEY was rejected as invalid. Please verify your Gemini API key in .env or Settings > Secrets.",
    };
  }

  if (statusFromErr === 401 || statusFromErr === 403) {
    return {
      status: statusFromErr,
      code: "PERMISSION_DENIED",
      message: `Gemini API authentication/permission error (${statusFromErr}): ${rawMessage}`,
    };
  }

  if (statusFromErr === 404) {
    return {
      status: 404,
      code: "MODEL_NOT_FOUND",
      message: `Requested Gemini model was not found or is unavailable for this API key (${rawMessage}).`,
    };
  }

  if (statusFromErr === 429 || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Gemini API rate limit or quota exceeded (429 RESOURCE_EXHAUSTED). Please wait a moment and try again.",
    };
  }

  return {
    status: statusFromErr >= 400 && statusFromErr < 600 ? statusFromErr : 500,
    code: anyErr?.code || "GEMINI_REQUEST_FAILED",
    message: `Gemini request failed: ${rawMessage}`,
  };
}
