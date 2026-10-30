import { extractObligationsFromText } from "../../server/businessTools.ts";
import { formatGeminiError } from "../../server/geminiClient.ts";

const MAX_INPUT_CHARS = 50000;

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
    const { contractName, counterparty, contractText } = body;

    if (!contractText || !contractText.trim()) {
      res
        .status(400)
        .json({ error: "Please provide contract text for obligation extraction." });
      return;
    }

    if (contractText.length > MAX_INPUT_CHARS) {
      res.status(400).json({
        error: `Contract text exceeds maximum length of ${MAX_INPUT_CHARS} characters.`,
      });
      return;
    }

    const extraction = await extractObligationsFromText({
      contractName: contractName || "Master Services Agreement",
      counterparty: counterparty || "Enterprise Counterparty",
      contractText: contractText.trim(),
    });

    res.status(200).json(extraction);
  } catch (err: unknown) {
    const formatted = formatGeminiError(
      err,
      "Failed to extract contract obligations with Gemini API."
    );
    res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
    });
  }
}
