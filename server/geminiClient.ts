import {
  GoogleGenAI,
  GenerateContentParameters,
  GenerateContentResponse,
} from "@google/genai";
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
      "Missing Gemini API Key: GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file or in the Settings > Secrets panel and restart the server."
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
 * Checks whether an error from the Gemini SDK is a 429 rate-limit / quota error
 * or a transient model unavailability error (500/502/503/504 UNAVAILABLE) that can be retried on a fallback model.
 */
export function isQuotaOrRateLimitError(err: unknown): boolean {
  const anyErr = err as {
    status?: number;
    code?: string | number;
    message?: string;
    error?: { code?: number; status?: string; message?: string };
  };
  const status = anyErr?.status || anyErr?.error?.code || anyErr?.code;
  const msg = String(anyErr?.message || anyErr?.error?.message || "");
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("UNAVAILABLE") ||
    msg.toLowerCase().includes("exceeded your current quota") ||
    msg.toLowerCase().includes("high demand")
  );
}

/**
 * Calls ai.models.generateContent with automatic model fallback when a specific model
 * hits a 429 RESOURCE_EXHAUSTED rate-limit or temporary unavailability (503 UNAVAILABLE).
 */
export async function generateContentWithFallback(
  params: GenerateContentParameters
): Promise<{ response: GenerateContentResponse; modelUsed: string }> {
  const ai = getGeminiClient();
  const primaryModel = params.model || GEMINI_FLASH_MODEL;

  const fallbackOrder = Array.from(
    new Set([primaryModel, GEMINI_FLASH_MODEL, GEMINI_FLASH_LITE_MODEL])
  );

  let lastError: unknown = null;

  for (const candidateModel of fallbackOrder) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: candidateModel,
      });
      return { response, modelUsed: candidateModel };
    } catch (err: unknown) {
      lastError = err;
      if (isQuotaOrRateLimitError(err)) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Ensures HTTP error status codes never trigger reverse-proxy HTML error page interception
 * (403, 502, 503, 504 are intercepted by nginx error_page directives and turned into HTML).
 */
function sanitizeHttpStatusForJsonApi(status: number): number {
  if (status === 403) return 401;
  if (status === 502 || status === 503 || status === 504) return 500;
  if (status >= 400 && status < 600) return status;
  return 500;
}

/**
 * Normalizes Gemini SDK and network errors into clear, actionable HTTP status codes and JSON messages.
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
      status: 500,
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
      status: 401,
      code: "PERMISSION_DENIED",
      message: `Gemini API authentication/permission error: ${rawMessage}`,
    };
  }

  if (statusFromErr === 404) {
    return {
      status: 404,
      code: "MODEL_NOT_FOUND",
      message: `Requested Gemini model was not found or is unavailable for this API key (${rawMessage}).`,
    };
  }

  if (isQuotaOrRateLimitError(err)) {
    return {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Gemini API rate limit or quota exceeded (429 RESOURCE_EXHAUSTED). Please wait a moment or check your Gemini API plan/quota.",
    };
  }

  return {
    status: sanitizeHttpStatusForJsonApi(statusFromErr),
    code: anyErr?.code || "GEMINI_REQUEST_FAILED",
    message: `Gemini request failed: ${rawMessage}`,
  };
}
