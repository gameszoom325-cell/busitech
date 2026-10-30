import { useState, useEffect, useCallback } from "react";
import {
  ContractMetadataCachePayload,
  ContractSummaryMetadata,
  SIMULATED_OFFLINE_KEY,
  buildContractMetadataPayload,
  fetchAndSyncContractMetadata,
  readCachedContractMetadata,
  registerContractServiceWorker,
  saveContractMetadataToCache,
} from "../services/contractCache";
import { MOCK_CONTRACTS, MOCK_OBLIGATIONS } from "../data/mockData";
import { downloadContractsFromState } from "../utils/csvExport";

export function useContractCache() {
  const [cachePayload, setCachePayload] =
    useState<ContractMetadataCachePayload>(() =>
      buildContractMetadataPayload(
        MOCK_CONTRACTS,
        MOCK_OBLIGATIONS,
        "local-storage"
      )
    );
  const [isUsingCachedFallback, setIsUsingCachedFallback] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === "true";
  });

  const syncContractCache = useCallback(
    async (overrideOffline?: boolean) => {
      setIsSyncing(true);
      try {
        const { payload } = await fetchAndSyncContractMetadata({
          forceOffline: overrideOffline ?? isSimulatedOffline,
        });
        setCachePayload(payload);
        setIsUsingCachedFallback(false);
        return { payload, fromCache: false };
      } finally {
        setIsSyncing(false);
      }
    },
    [isSimulatedOffline]
  );

  const toggleSimulatedOffline = useCallback(
    async (nextOffline?: boolean) => {
      const target = nextOffline ?? !isSimulatedOffline;
      setIsSimulatedOffline(target);
      if (typeof window !== "undefined") {
        localStorage.setItem(SIMULATED_OFFLINE_KEY, String(target));
        window.dispatchEvent(
          new CustomEvent("c2a:offline-mode-changed", {
            detail: { offline: target },
          })
        );
      }
      if (target) {
        const cached = await readCachedContractMetadata();
        setCachePayload(cached);
        setIsUsingCachedFallback(true);
      } else {
        await syncContractCache(false);
      }
    },
    [isSimulatedOffline, syncContractCache]
  );

  useEffect(() => {
    registerContractServiceWorker().then((reg) => {
      setSwRegistered(Boolean(reg));
    });
    syncContractCache();
  }, [syncContractCache]);

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      if (!isSimulatedOffline) {
        syncContractCache(false);
      }
    };
    const handleOffline = async () => {
      setIsBrowserOnline(false);
      const cached = await readCachedContractMetadata();
      setCachePayload(cached);
      setIsUsingCachedFallback(true);
    };
    const handleCustomOfflineChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ offline: boolean }>;
      const offline = Boolean(customEvent.detail?.offline);
      setIsSimulatedOffline(offline);
      if (offline) {
        readCachedContractMetadata().then((cached) => {
          setCachePayload(cached);
          setIsUsingCachedFallback(true);
        });
      } else {
        syncContractCache(false);
      }
    };
    const handleDataUpdated = () => {
      const updated = buildContractMetadataPayload(
        MOCK_CONTRACTS,
        MOCK_OBLIGATIONS,
        cachePayload.source
      );
      saveContractMetadataToCache(updated);
      setCachePayload(updated);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(
      "c2a:offline-mode-changed",
      handleCustomOfflineChange
    );
    window.addEventListener("c2a:data-updated", handleDataUpdated);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "c2a:offline-mode-changed",
        handleCustomOfflineChange
      );
      window.removeEventListener("c2a:data-updated", handleDataUpdated);
    };
  }, [cachePayload.source, isSimulatedOffline, syncContractCache]);

  const getContractSummary = useCallback(
    (contractId: string): ContractSummaryMetadata | undefined => {
      return (
        cachePayload.summaries[contractId] ||
        Object.values(cachePayload.summaries)[0]
      );
    },
    [cachePayload.summaries]
  );

  const isOfflineMode = false;

  /**
   * Converts the contract data currently in state (or a filtered subset) into a CSV string
   * and triggers a browser download for the user.
   */
  const downloadContractsCSV = useCallback(
    (customContracts?: typeof cachePayload.contracts, fileNamePrefix?: string) => {
      const targetContracts = customContracts ?? cachePayload.contracts;
      return downloadContractsFromState(
        targetContracts,
        cachePayload.summaries,
        {
          fileNamePrefix: fileNamePrefix || "contracts_offline_report",
          cacheSource: isOfflineMode
            ? `${cachePayload.source} (offline)`
            : cachePayload.source,
          syncedAt: cachePayload.syncedAt,
        }
      );
    },
    [
      cachePayload.contracts,
      cachePayload.summaries,
      cachePayload.source,
      cachePayload.syncedAt,
      isOfflineMode,
    ]
  );

  return {
    contracts: cachePayload.contracts,
    summaries: cachePayload.summaries,
    syncedAt: cachePayload.syncedAt,
    cacheSource: cachePayload.source,
    isOfflineMode,
    isSimulatedOffline,
    isSyncing,
    swRegistered,
    syncContractCache,
    toggleSimulatedOffline,
    getContractSummary,
    downloadContractsCSV,
  };
}
