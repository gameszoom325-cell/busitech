import { MOCK_CONTRACTS, MOCK_OBLIGATIONS } from "../data/mockData";
import { Contract, Obligation } from "../types";

export const CONTRACT_CACHE_STORAGE_KEY = "c2a_contract_metadata_cache_v1";
export const CONTRACT_SW_CACHE_NAME = "c2a-contract-metadata-v2";
export const SIMULATED_OFFLINE_KEY = "c2a_simulated_offline_mode";

export interface ContractSummaryMetadata {
  contractId: string;
  code: string;
  name: string;
  counterparty: string;
  type: string;
  status: Contract["status"];
  obligationsCount: number;
  nextDeadlineToDisplay: string;
  hasRisk: boolean;
  fileSize: string;
  uploadedAt: string;
  executiveSummary: string;
  governingLaw: string;
  renewalTerms: string;
  annualContractValue: string;
  keyClauses: Array<{
    clauseRef: string;
    title: string;
    summary: string;
    riskLevel: "High" | "Medium" | "Low";
  }>;
  obligationsPreview: Array<{
    id: string;
    title: string;
    clauseRef: string;
    dueDateFormatted: string;
    status: Obligation["status"];
    risk: Obligation["risk"];
    ownerName: string;
  }>;
}

export interface ContractMetadataCachePayload {
  version: string;
  syncedAt: string;
  source: "network" | "service-worker" | "local-storage";
  contracts: Contract[];
  summaries: Record<string, ContractSummaryMetadata>;
}

const DEFAULT_CONTRACT_ENRICHMENTS: Record<
  string,
  {
    executiveSummary: string;
    governingLaw: string;
    renewalTerms: string;
    annualContractValue: string;
    keyClauses: ContractSummaryMetadata["keyClauses"];
  }
> = {
  ctr_stripe_msa: {
    executiveSummary:
      "Global payment processing Master Services Agreement with Stripe Inc. Covers PCI-DSS Level 1 attestation requirements, quarterly fee tier volume reconciliations, and 48-hour incident reporting SLAs.",
    governingLaw: "State of California, USA",
    renewalTerms: "Auto-renews annually unless 60 days prior written notice",
    annualContractValue: "$185,000 / yr",
    keyClauses: [
      {
        clauseRef: "Clause §4.2",
        title: "Quarterly Payment Processing Reconciliation",
        summary:
          "Requires quarterly audit of payment processing volume tiers and interchange rebate credits within 15 days of quarter close.",
        riskLevel: "High",
      },
      {
        clauseRef: "Clause §9.4",
        title: "Annual SOC 2 Type II & PCI-DSS Attestation",
        summary:
          "Mandates delivery of updated SOC 2 Type II compliance certification and encryption audit logs.",
        riskLevel: "High",
      },
      {
        clauseRef: "Section 14.5",
        title: "Limitation of Liability & Indemnification Cap",
        summary:
          "Caps aggregate liability at 12 months of preceding processing fees excluding data breach obligations.",
        riskLevel: "Medium",
      },
    ],
  },
  ctr_aws_cloud: {
    executiveSummary:
      "Enterprise Cloud Subscription Agreement with Amazon Web Services governing multi-region failover SLAs (99.99% availability), data residency in US-East/EU-Central, and monthly reserved instance utilization reviews.",
    governingLaw: "State of Washington, USA",
    renewalTerms: "36-month enterprise commitment with annual true-up",
    annualContractValue: "$420,000 / yr",
    keyClauses: [
      {
        clauseRef: "Clause §9.4",
        title: "Annual Cloud Security & Penetration Audit",
        summary:
          "Annual security posture verification and IAM key rotation compliance attestation across production VPCs.",
        riskLevel: "High",
      },
      {
        clauseRef: "Clause §6.1",
        title: "Multi-Region Uptime SLA & Service Credits",
        summary:
          "Provides 10%–30% service credit claims if monthly regional availability drops below 99.99%.",
        riskLevel: "Medium",
      },
    ],
  },
  ctr_salesforce_sa: {
    executiveSummary:
      "Enterprise CRM subscription agreement with Salesforce.com Inc. Contains a strict 60-day non-renewal notification window prior to October 28, 2025 to prevent automatic 12-month renewal at $48,000 list rate.",
    governingLaw: "State of California, USA",
    renewalTerms: "Automatic 12-month renewal ($48,000) without 60-day notice",
    annualContractValue: "$48,000 / yr",
    keyClauses: [
      {
        clauseRef: "Section 14.2",
        title: "Automatic Renewal & Termination Notice Window",
        summary:
          "Requires formal written notice at least 60 days before term expiration to avoid automatic 12-month lock-in.",
        riskLevel: "High",
      },
      {
        clauseRef: "Section 8.3",
        title: "API Rate Limits & Seat True-Up",
        summary:
          "Quarterly review of enterprise seat licenses and bulk API call allocations.",
        riskLevel: "Low",
      },
    ],
  },
  ctr_datadog_dpa: {
    executiveSummary:
      "Non-Disclosure & Data Processing Addendum with Datadog HQ governing observability telemetry sanitization, PII scrubbing, EU-US Data Privacy Framework compliance, and 24-hour sub-processor change notifications.",
    governingLaw: "State of New York, USA (EU SCCs attached)",
    renewalTerms: "Co-terminous with Master Subscription Agreement",
    annualContractValue: "$84,000 / yr",
    keyClauses: [
      {
        clauseRef: "Clause §7.1",
        title: "Telemetry PII Scrubbing & Sub-Processor Audit",
        summary:
          "Requires quarterly review of authorized sub-processors and log retention purge schedules.",
        riskLevel: "Medium",
      },
      {
        clauseRef: "Clause §5.3",
        title: "Security Breach Notification Protocol",
        summary:
          "Mandates notification within 24 hours of any confirmed unauthorized access to customer telemetry streams.",
        riskLevel: "High",
      },
    ],
  },
  ctr_dhl_supply: {
    executiveSummary:
      "Global Vendor Logistics & Fulfillment Contract with DHL Supply Chain covering warehouse cold-chain temperature SLAs, customs clearance turnaround guarantees, and quarterly freight fuel surcharge audits.",
    governingLaw: "Laws of England & Wales",
    renewalTerms: "24-month renewal term with 90-day termination notice",
    annualContractValue: "$310,000 / yr",
    keyClauses: [
      {
        clauseRef: "Section 6.4",
        title: "Cold-Chain Inspection & SLA Penalty Rebates",
        summary:
          "Requires physical inspection sign-off within 48 hours of port arrival and 12% rebate credits on delayed shipments.",
        riskLevel: "High",
      },
      {
        clauseRef: "Section 9.1",
        title: "Quarterly Freight Index & Fuel Surcharge Audit",
        summary:
          "Caps quarterly fuel surcharge adjustments at 4.5% above baseline carrier index.",
        riskLevel: "Medium",
      },
    ],
  },
  ctr_snowflake_so: {
    executiveSummary:
      "Snowflake Enterprise Service Order with Snowflake Computing governing cross-region data warehouse credits, Business Critical edition encryption, and annual capacity commit rollover rules.",
    governingLaw: "State of Delaware, USA",
    renewalTerms: "Annual capacity rollover with 45-day written notice",
    annualContractValue: "$135,000 / yr",
    keyClauses: [
      {
        clauseRef: "Section 11.2",
        title: "Warehouse Availability SLA & Credit Rollover",
        summary:
          "Entitles customer to 15% service credit reconciliation if regional warehouse availability breaches 99.9%.",
        riskLevel: "Medium",
      },
    ],
  },
};

/**
 * Builds a complete ContractMetadataCachePayload from contracts and obligations.
 */
export function buildContractMetadataPayload(
  contracts: Contract[] = MOCK_CONTRACTS,
  obligations: Obligation[] = MOCK_OBLIGATIONS,
  source: ContractMetadataCachePayload["source"] = "local-storage",
  syncedAt: string = new Date().toISOString()
): ContractMetadataCachePayload {
  const summaries: Record<string, ContractSummaryMetadata> = {};

  for (const contract of contracts) {
    const enrichment = DEFAULT_CONTRACT_ENRICHMENTS[contract.id];
    const matchingObligations = obligations.filter(
      (o) =>
        o.contractId === contract.id ||
        o.contractName.toLowerCase().includes(contract.counterparty.toLowerCase()) ||
        contract.name.toLowerCase().includes(o.contractName.toLowerCase())
    );

    summaries[contract.id] = {
      contractId: contract.id,
      code: contract.code,
      name: contract.name,
      counterparty: contract.counterparty,
      type: contract.type,
      status: contract.status,
      obligationsCount: contract.obligationsCount,
      nextDeadlineToDisplay: contract.nextDeadlineToDisplay,
      hasRisk: Boolean(contract.hasRisk),
      fileSize: contract.fileSize || "3.2 MB",
      uploadedAt: contract.uploadedDate || "2025-09-15",
      executiveSummary:
        enrichment?.executiveSummary ||
        `Enterprise ${contract.type} with ${contract.counterparty} (${contract.code}). Tracks ${contract.obligationsCount} active contractual obligations with next milestone on ${contract.nextDeadlineToDisplay}.`,
      governingLaw: enrichment?.governingLaw || "State of Delaware, USA",
      renewalTerms:
        enrichment?.renewalTerms ||
        "12-month renewal term with 60-day written notice",
      annualContractValue: enrichment?.annualContractValue || "$75,000 / yr",
      keyClauses: enrichment?.keyClauses || [
        {
          clauseRef: "Section 4.1",
          title: "Primary Service & Delivery Obligations",
          summary: `Core operational deliverables and milestone tracking for ${contract.counterparty}.`,
          riskLevel: contract.hasRisk ? "High" : "Medium",
        },
      ],
      obligationsPreview: matchingObligations.slice(0, 5).map((ob) => ({
        id: ob.id,
        title: ob.title,
        clauseRef: ob.clauseRef,
        dueDateFormatted: ob.dueDateFormatted || ob.dueDate,
        status: ob.status,
        risk: ob.risk,
        ownerName: ob.ownerName,
      })),
    };
  }

  return {
    version: "1.0.0",
    syncedAt,
    source,
    contracts: [...contracts],
    summaries,
  };
}

/**
 * Registers the Service Worker (/sw.js) so contract metadata and static assets
 * remain available when backend connectivity is interrupted.
 */
export async function registerContractServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch {
    return null;
  }
}

/**
 * Saves contract metadata snapshot to both localStorage and Service Worker Cache Storage.
 */
export async function saveContractMetadataToCache(
  payload: ContractMetadataCachePayload
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONTRACT_CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }

  // Also persist in Cache Storage API for Service Worker offline interception
  if ("caches" in window) {
    try {
      const cache = await window.caches.open(CONTRACT_SW_CACHE_NAME);
      const response = new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-C2A-Cache": "HIT-SERVICE-WORKER",
        },
      });
      await cache.put("/api/contracts/metadata", response);
    } catch {
      // Ignore if Cache Storage is unavailable in restricted contexts
    }
  }

  // Notify active Service Worker if present
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_CONTRACT_METADATA",
        payload,
      });
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Reads cached contract metadata from Service Worker Cache Storage or localStorage.
 */
export async function readCachedContractMetadata(): Promise<ContractMetadataCachePayload> {
  if (typeof window !== "undefined") {
    // 1. Check Service Worker Cache Storage first
    if ("caches" in window) {
      try {
        const cache = await window.caches.open(CONTRACT_SW_CACHE_NAME);
        const match = await cache.match("/api/contracts/metadata");
        if (match) {
          const text = await match.text();
          if (text.trim().startsWith("{")) {
            const parsed = JSON.parse(text) as ContractMetadataCachePayload;
            if (parsed && Array.isArray(parsed.contracts) && parsed.summaries) {
              return {
                ...parsed,
                source: "service-worker",
              };
            }
          }
        }
      } catch {
        // Fall through to localStorage
      }
    }

    // 2. Check localStorage fallback
    try {
      const raw = localStorage.getItem(CONTRACT_CACHE_STORAGE_KEY);
      if (raw && raw.trim().startsWith("{")) {
        const parsed = JSON.parse(raw) as ContractMetadataCachePayload;
        if (parsed && Array.isArray(parsed.contracts) && parsed.summaries) {
          return {
            ...parsed,
            source: "local-storage",
          };
        }
      }
    } catch {
      // Fall through to seed
    }
  }

  // 3. Seed initial cache if none exists yet
  const initialPayload = buildContractMetadataPayload(
    MOCK_CONTRACTS,
    MOCK_OBLIGATIONS,
    "local-storage"
  );
  await saveContractMetadataToCache(initialPayload);
  return initialPayload;
}

/**
 * Fetches live contract metadata from the backend (/api/contracts/metadata),
 * automatically caching it to Service Worker Cache Storage and localStorage,
 * and seamlessly falling back to cached metadata if the backend connection is interrupted.
 */
export async function fetchAndSyncContractMetadata(options?: {
  forceOffline?: boolean;
}): Promise<{
  payload: ContractMetadataCachePayload;
  fromCache: boolean;
}> {
  const isSimulatedOffline =
    options?.forceOffline ??
    (typeof window !== "undefined" &&
      localStorage.getItem(SIMULATED_OFFLINE_KEY) === "true");

  if (
    isSimulatedOffline ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  ) {
    const cached = await readCachedContractMetadata();
    return {
      payload: cached,
      fromCache: true,
    };
  }

  try {
    const res = await fetch("/api/contracts/metadata", {
      headers: { Accept: "application/json" },
    });

    const servedBySwCache =
      res.headers.get("X-C2A-Cache") === "HIT-SERVICE-WORKER";
    const text = await res.text();

    if (res.ok && text.trim().startsWith("{")) {
      const data = JSON.parse(text) as ContractMetadataCachePayload;
      if (data && Array.isArray(data.contracts) && data.summaries) {
        const normalized: ContractMetadataCachePayload = {
          ...data,
          source: servedBySwCache ? "service-worker" : "network",
        };
        await saveContractMetadataToCache(normalized);
        return {
          payload: normalized,
          fromCache: servedBySwCache,
        };
      }
    }
  } catch {
    // Network / backend interrupted — fall back to local cache
  }

  const cached = await readCachedContractMetadata();
  return {
    payload: cached,
    fromCache: true,
  };
}
