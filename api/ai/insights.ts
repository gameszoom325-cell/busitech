import { generateBusinessInsights } from "../../server/businessTools";
import { formatOllamaError } from "../../server/ollamaClient";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { focusArea, prompt, snapshot } = body;

    const result = await generateBusinessInsights({
      focusArea: focusArea || prompt || "overall portfolio governance",
      snapshot,
    });

    res.status(200).json(result);
  } catch (err: unknown) {
    const formatted = formatOllamaError(
      err,
      "Failed to generate business insights with Ollama Cloud API."
    );
    res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
    });
  }
}
