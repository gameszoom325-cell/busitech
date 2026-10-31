import {
  MOCK_CONTRACTS,
  MOCK_OBLIGATIONS,
} from "../../src/data/mockData";
import { buildContractMetadataPayload } from "../../src/services/contractCache";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Cache-Control", "no-cache");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const payload = buildContractMetadataPayload(
    MOCK_CONTRACTS,
    MOCK_OBLIGATIONS,
    "network",
    new Date().toISOString()
  );

  res.status(200).json(payload);
}
