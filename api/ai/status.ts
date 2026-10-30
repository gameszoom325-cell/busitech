import {
  hasValidNvidiaApiKey,
  NVIDIA_MODEL,
  ALLOWED_MODELS,
} from "../../server/nvidiaClient.ts";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Read inside the request handler and trim
  const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
  const connected = Boolean(apiKey && apiKey !== "your_nvidia_api_key_here");
  res.status(200).json({
    connected,
    provider: "NVIDIA",
    model: NVIDIA_MODEL,
    availableModels: ALLOWED_MODELS,
    endpoints: ["POST /api/ai/chat"],
    ...(connected
      ? {}
      : {
          message:
            "NVIDIA_API_KEY is missing. Set NVIDIA_API_KEY in Vercel Project Settings > Environment Variables.",
        }),
  });
}
