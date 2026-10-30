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

  const connected = hasValidNvidiaApiKey();
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
