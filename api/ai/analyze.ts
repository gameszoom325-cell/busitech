import { extractObligationsFromText, runBusinessAgentWithTools } from "../../server/businessTools.ts";
import { formatOllamaError } from "../../server/ollamaClient.ts";

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
    const { contractName, counterparty, contractText, prompt, data, text, snapshot, model } = body;

    // Path 1: Obligation extraction
    if (typeof contractText === "string" && contractText.trim()) {
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
      return;
    }

    // Path 2: General business analysis
    const analysisInput =
      typeof prompt === "string" && prompt.trim()
        ? prompt.trim()
        : typeof text === "string" && text.trim()
        ? text.trim()
        : data !== undefined
        ? typeof data === "string"
          ? data.trim()
          : JSON.stringify(data)
        : "";

    if (!analysisInput) {
      res
        .status(400)
        .json({ error: "Please provide 'contractText', 'prompt', or 'data' to analyze." });
      return;
    }

    const result = await runBusinessAgentWithTools({
      prompt: `Analyze the following business/contract information and provide structured findings, risk exposure, and recommended actions:\n\n${analysisInput}`,
      snapshot,
      mode: "agent",
      model: typeof model === "string" ? model : undefined,
      rolePersona: "risk_analyst",
    });

    res.status(200).json({
      analysis: result.reply,
      reply: result.reply,
      toolCalls: result.toolCalls,
      clientActions: result.clientActions,
      modelUsed: result.modelUsed,
    });
  } catch (err: unknown) {
    const formatted = formatOllamaError(
      err,
      "Failed to analyze data with Ollama Cloud API."
    );
    res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
    });
  }
}
