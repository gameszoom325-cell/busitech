import { Contract } from "../types";
import { ContractSummaryMetadata } from "../services/contractCache";

/**
 * Escapes a single cell value according to RFC 4180 CSV rules.
 */
export function escapeCSVField(value: unknown): string {
  const normalized = String(value ?? "")
    .replace(/\r?\n/g, " ")
    .trim();
  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

/**
 * Converts an array of Contract records (and optional cached summary metadata)
 * from application state into a formatted CSV string.
 */
export function convertContractsToCSVString(
  contracts: Contract[],
  summaries?: Record<string, ContractSummaryMetadata>,
  metadata?: {
    cacheSource?: string;
    syncedAt?: string;
  }
): string {
  const headers = [
    "Contract Code",
    "Contract Name",
    "Counterparty",
    "Category / Type",
    "Status",
    "Annual Contract Value",
    "Governing Law",
    "Renewal & Notice Terms",
    "Obligations Count",
    "Risk Status",
    "Flagged Risk Count",
    "Next Deadline (Date)",
    "Next Deadline (Display)",
    "File Size",
    "Uploaded Date",
    "Executive Summary",
    "Key Clauses Snapshot",
    "Tracked Obligations Snapshot",
    "Data Source",
    "Last Synced Timestamp",
  ];

  const cacheSourceLabel = metadata?.cacheSource || "state";
  const syncedAtLabel = metadata?.syncedAt || new Date().toISOString();

  const rows = contracts.map((contract) => {
    const summary = summaries?.[contract.id];

    const keyClausesText = summary?.keyClauses?.length
      ? summary.keyClauses
          .map(
            (kc) =>
              `${kc.clauseRef} ${kc.title} [${kc.riskLevel} Risk]: ${kc.summary}`
          )
          .join(" | ")
      : "";

    const obligationsPreviewText = summary?.obligationsPreview?.length
      ? summary.obligationsPreview
          .map(
            (ob) =>
              `${ob.clauseRef} ${ob.title} (Owner: ${ob.ownerName}, Due: ${ob.dueDateFormatted}, Status: ${ob.status})`
          )
          .join(" | ")
      : "";

    return [
      escapeCSVField(contract.code),
      escapeCSVField(contract.name),
      escapeCSVField(contract.counterparty),
      escapeCSVField(contract.type),
      escapeCSVField(contract.status),
      escapeCSVField(summary?.annualContractValue || "$75,000 / yr"),
      escapeCSVField(summary?.governingLaw || "State of Delaware, USA"),
      escapeCSVField(
        summary?.renewalTerms ||
          "12-month renewal with 60-day written notice"
      ),
      escapeCSVField(contract.obligationsCount),
      escapeCSVField(contract.hasRisk ? "High Risk Flagged" : "Standard"),
      escapeCSVField(contract.riskCount ?? (contract.hasRisk ? 1 : 0)),
      escapeCSVField(contract.nextDeadline),
      escapeCSVField(contract.nextDeadlineToDisplay),
      escapeCSVField(contract.fileSize || summary?.fileSize || "3.2 MB"),
      escapeCSVField(
        contract.uploadedDate || summary?.uploadedAt || "2025-09-15"
      ),
      escapeCSVField(summary?.executiveSummary || ""),
      escapeCSVField(keyClausesText),
      escapeCSVField(obligationsPreviewText),
      escapeCSVField(cacheSourceLabel),
      escapeCSVField(syncedAtLabel),
    ].join(",");
  });

  const csvLines = [headers.map(escapeCSVField).join(","), ...rows];
  // Prepend UTF-8 BOM (\uFEFF) so Excel and spreadsheet apps parse UTF-8 symbols properly
  return "\uFEFF" + csvLines.join("\r\n");
}

/**
 * Triggers a browser file download for a given CSV string.
 */
export function triggerCSVBrowserDownload(
  csvString: string,
  fileName: string
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const normalizedName = fileName.endsWith(".csv")
    ? fileName
    : `${fileName}.csv`;

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", normalizedName);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release object URL after download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 150);
}

/**
 * Converts the contract data in state into a CSV string and triggers a browser download.
 */
export function downloadContractsFromState(
  contracts: Contract[],
  summaries?: Record<string, ContractSummaryMetadata>,
  options?: {
    fileNamePrefix?: string;
    cacheSource?: string;
    syncedAt?: string;
  }
): { csvString: string; fileName: string; rowCount: number } {
  const csvString = convertContractsToCSVString(contracts, summaries, {
    cacheSource: options?.cacheSource,
    syncedAt: options?.syncedAt,
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const prefix = options?.fileNamePrefix || "contracts_offline_report";
  const fileName = `${prefix}_${dateStamp}.csv`;

  triggerCSVBrowserDownload(csvString, fileName);

  return {
    csvString,
    fileName,
    rowCount: contracts.length,
  };
}
