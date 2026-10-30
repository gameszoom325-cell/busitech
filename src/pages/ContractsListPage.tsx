import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  Search,
  Download,
  AlertCircle,
  Database,
  WifiOff,
  RefreshCw,
  Eye,
  CheckCircle2,
  Calendar,
  X,
  RotateCcw,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { SmartExportButton } from "../components/modals/SmartExportModal";
import { useContractCache } from "../hooks/useContractCache";
import { ContractSummaryMetadata } from "../services/contractCache";
import { ContractSummaryModal } from "../components/modals/ContractSummaryModal";
import { Contract } from "../types";

export const ContractsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    contracts,
    summaries,
    syncedAt,
    cacheSource,
    isOfflineMode,
    isSimulatedOffline,
    isSyncing,
    swRegistered,
    syncContractCache,
    toggleSimulatedOffline,
    downloadContractsCSV,
  } = useContractCache();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [exactDateInput, setExactDateInput] = useState("");
  const [counterpartyFilter, setCounterpartyFilter] = useState("All");
  const [selectedSummary, setSelectedSummary] =
    useState<ContractSummaryMetadata | null>(null);

  const counterparties = Array.from(
    new Set(contracts.map((c) => c.counterparty))
  );

  const uniqueDeadlines = Array.from(
    new Set(contracts.map((c) => c.nextDeadlineToDisplay).filter(Boolean))
  );

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "All" ||
    dateFilter !== "All" ||
    exactDateInput.trim() !== "" ||
    counterpartyFilter !== "All";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setDateFilter("All");
    setExactDateInput("");
    setCounterpartyFilter("All");
  };

  const filteredContracts = contracts.filter((c) => {
    // 1. Status dropdown / pill filter
    if (statusFilter !== "All" && c.status !== statusFilter) return false;

    // 2. Counterparty filter
    if (counterpartyFilter !== "All" && c.counterparty !== counterpartyFilter)
      return false;

    // 3. Date preset / deadline filter
    if (dateFilter !== "All") {
      const deadlineDisplay = (c.nextDeadlineToDisplay || "").toLowerCase();
      const deadlineIso = (c.nextDeadline || "").toLowerCase();
      const uploadedDate = (
        c.uploadedDate ||
        summaries[c.id]?.uploadedAt ||
        ""
      ).toLowerCase();

      if (dateFilter === "OCT_2025") {
        if (
          !deadlineDisplay.includes("oct") &&
          !deadlineIso.startsWith("2025-10")
        )
          return false;
      } else if (dateFilter === "NOV_2025") {
        if (
          !deadlineDisplay.includes("nov") &&
          !deadlineIso.startsWith("2025-11")
        )
          return false;
      } else if (dateFilter === "DEC_2025") {
        if (
          !deadlineDisplay.includes("dec") &&
          !deadlineIso.startsWith("2025-12")
        )
          return false;
      } else if (
        c.nextDeadlineToDisplay !== dateFilter &&
        c.nextDeadline !== dateFilter &&
        !uploadedDate.includes(dateFilter.toLowerCase())
      ) {
        return false;
      }
    }

    // 4. Exact calendar date picker filter (YYYY-MM-DD)
    if (exactDateInput.trim()) {
      const targetIso = exactDateInput.trim();
      const matchesIsoDeadline = c.nextDeadline === targetIso;
      const matchesUploaded =
        (c.uploadedDate || summaries[c.id]?.uploadedAt || "") === targetIso;

      // Also compare formatted date (e.g. 2025-10-24 -> Oct 24, 2025)
      let formattedTarget = "";
      try {
        const [y, m, d] = targetIso.split("-").map(Number);
        if (y && m && d) {
          const dt = new Date(y, m - 1, d);
          formattedTarget = dt
            .toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })
            .toLowerCase();
        }
      } catch {
        // ignore
      }

      const matchesFormatted =
        formattedTarget &&
        c.nextDeadlineToDisplay.toLowerCase().includes(formattedTarget);

      if (!matchesIsoDeadline && !matchesUploaded && !matchesFormatted) {
        return false;
      }
    }

    // 5. Top Search Bar query (matches Name, Status, or Date, plus code/counterparty/summary)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const summaryText =
        summaries[c.id]?.executiveSummary?.toLowerCase() || "";
      const uploadedAt = (
        c.uploadedDate ||
        summaries[c.id]?.uploadedAt ||
        ""
      ).toLowerCase();

      return (
        c.name.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.nextDeadlineToDisplay.toLowerCase().includes(q) ||
        c.nextDeadline.toLowerCase().includes(q) ||
        uploadedAt.includes(q) ||
        c.counterparty.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        summaryText.includes(q)
      );
    }

    return true;
  });

  const handleExportCSV = (
    targetContracts?: Contract[],
    customPrefix?: string
  ) => {
    const listToExport = targetContracts ?? filteredContracts;
    if (listToExport.length === 0) {
      showToast("No contracts match the current filter to export", "warning");
      return;
    }

    const { fileName, rowCount } = downloadContractsCSV(
      listToExport,
      customPrefix || "contracts_offline_report"
    );

    showToast(
      `Exported ${rowCount} contract${rowCount === 1 ? "" : "s"} to ${fileName}`,
      "success"
    );
  };

  const handleSyncCache = async () => {
    const { fromCache } = await syncContractCache();
    if (fromCache) {
      showToast(
        "Backend connection interrupted — serving contract summaries from local cache",
        "warning"
      );
    } else {
      showToast(
        "Contract metadata & summaries synced to Service Worker + LocalStorage cache",
        "success"
      );
    }
  };

  const handleToggleOfflineSimulation = async () => {
    const nextState = !isSimulatedOffline;
    await toggleSimulatedOffline(nextState);
    if (nextState) {
      showToast(
        "Simulated backend interruption enabled — viewing cached contract summaries",
        "warning"
      );
    } else {
      showToast(
        "Backend connection restored — synced live contract metadata",
        "success"
      );
    }
  };

  const formattedSyncTime = (() => {
    try {
      return new Date(syncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "Cached";
    }
  })();

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-primary-text)] uppercase mb-1 truncate">
          PLATFORM / CONTRACT REPOSITORY
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
              Contracts
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
              Centralized repository of active vendor, customer, and partner
              agreements with offline-ready metadata caching.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <SmartExportButton
              label="Smart Export (PDF / CSV)"
              customContracts={filteredContracts}
            />

            <button
              type="button"
              onClick={() => handleExportCSV(filteredContracts)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px] cursor-pointer"
              title="Download filtered contracts list with cached summaries & clauses as an offline CSV report"
            >
              <Download className="w-3.5 h-3.5 shrink-0 text-[var(--color-success)]" />
              <span className="whitespace-nowrap">
                Export CSV ({filteredContracts.length})
              </span>
            </button>

            <button
              onClick={() => navigate("/upload")}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Upload Contract</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SEARCH & FILTER BAR (Filter by Name, Status, or Date) */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Primary Search Input (Name, Status, or Date) */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-primary)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts by name (e.g. Stripe MSA), status (Active, Pending Review), or date (Oct 24, 2025)..."
              aria-label="Search contracts by name, status, or date"
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-md absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dedicated Status, Date & Counterparty Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by contract status"
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px] flex-1 sm:flex-initial"
            >
              <option value="All">Status: All</option>
              <option value="Active">Status: Active</option>
              <option value="Pending Review">Status: Pending Review</option>
              <option value="Archived">Status: Archived</option>
            </select>

            {/* Date / Deadline Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by deadline period or date"
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px] flex-1 sm:flex-initial"
            >
              <option value="All">Date: All Deadlines</option>
              <option value="OCT_2025">Month: Oct 2025</option>
              <option value="NOV_2025">Month: Nov 2025</option>
              <option value="DEC_2025">Month: Dec 2025</option>
              {uniqueDeadlines.map((dl) => (
                <option key={dl} value={dl}>
                  Deadline: {dl}
                </option>
              ))}
            </select>

            {/* Exact Date Picker */}
            <div className="relative flex items-center flex-1 sm:flex-initial">
              <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-[var(--color-text-subtle)] pointer-events-none" />
              <input
                type="date"
                value={exactDateInput}
                onChange={(e) => setExactDateInput(e.target.value)}
                aria-label="Filter by exact date"
                className="pl-8 pr-2.5 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px] w-full sm:w-auto"
              />
            </div>

            {/* Counterparty Filter */}
            <select
              value={counterpartyFilter}
              onChange={(e) => setCounterpartyFilter(e.target.value)}
              aria-label="Filter by counterparty"
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px] flex-1 sm:flex-initial"
            >
              <option value="All">All Counterparties</option>
              {counterparties.map((cp) => (
                <option key={cp} value={cp}>
                  {cp}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-h-[40px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Status Filter Pills & Match Summary */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[var(--color-border-subtle)] text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[var(--color-text-subtle)] mr-1">
              Quick Filter:
            </span>
            {(["All", "Active", "Pending Review", "Archived"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border-subtle)]"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
            Showing <strong>{filteredContracts.length}</strong> of{" "}
            <strong>{contracts.length}</strong> contracts
          </span>
        </div>
      </div>

      {/* Offline & Service Worker / LocalStorage Cache Status Bar */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 transition-colors ${
          isOfflineMode
            ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]/75"
            : "border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)]"
        }`}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isOfflineMode
                ? "bg-[var(--color-warning)]/20 text-[var(--color-warning-text)]"
                : "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
            }`}
          >
            {isOfflineMode ? (
              <WifiOff className="w-4 h-4" />
            ) : (
              <Database className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--color-text-main)]">
                {isOfflineMode
                  ? "Backend Connection Interrupted • Viewing Cached Contract Summaries"
                  : "Contract Metadata Cache Active (Service Worker + LocalStorage)"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />
                <span>
                  {swRegistered ? "SW + LocalStorage" : "LocalStorage"} •{" "}
                  {contracts.length} summaries cached
                </span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              {isOfflineMode
                ? `Serving ${contracts.length} contract summaries from ${cacheSource} snapshot (last synced at ${formattedSyncTime}). Click "Summary" on any agreement to inspect cached clauses.`
                : `Last synced at ${formattedSyncTime}. Basic contract summaries, governing law, renewal windows, and key clauses remain accessible if backend connectivity drops.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleSyncCache}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-xs font-semibold text-[var(--color-text-main)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[var(--color-primary)] ${
                isSyncing ? "animate-spin" : ""
              }`}
            />
            <span>Sync Cache</span>
          </button>

          <button
            type="button"
            onClick={handleToggleOfflineSimulation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isSimulatedOffline
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                : "bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              {isSimulatedOffline
                ? "Restore Live Connection"
                : "Simulate Offline Mode"}
            </span>
          </button>
        </div>
      </div>

      {/* Contracts Table / Stacked Cards */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] overflow-hidden min-w-0">
        {/* DESKTOP/TABLET TABLE (≥ 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                <th className="py-3.5 px-5">CONTRACT NAME & CACHED SUMMARY</th>
                <th className="py-3.5 px-4">COUNTERPARTY</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">OBLIGATIONS</th>
                <th className="py-3.5 px-4">NEXT DEADLINE</th>
                <th className="py-3.5 px-4 text-right">STATUS & SUMMARY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-xs">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-[var(--color-text-muted)]"
                  >
                    No contracts matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const summaryMeta = summaries[c.id];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/contracts/${c.id}/analysis`)}
                      className="hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-5 max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">
                              ID: {c.code} • {c.fileSize || "3.4 MB"} •{" "}
                              {summaryMeta?.annualContractValue || "$75,000/yr"}
                            </div>
                            {summaryMeta?.executiveSummary && (
                              <p className="text-[11px] text-[var(--color-text-subtle)] line-clamp-1 mt-1">
                                {summaryMeta.executiveSummary}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-[var(--color-text-main)] whitespace-nowrap">
                        {c.counterparty}
                      </td>

                      <td className="py-4 px-4 text-[var(--color-text-muted)] whitespace-nowrap">
                        {c.type}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {c.hasRisk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{c.obligationsCount} obligations</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)]">
                            <span>{c.obligationsCount} extracted</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-[var(--color-text-main)] whitespace-nowrap">
                        {c.nextDeadlineToDisplay}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              c.status === "Active"
                                ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]"
                                : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                c.status === "Active"
                                  ? "bg-[var(--color-success)]"
                                  : "bg-[var(--color-warning)]"
                              }`}
                            />
                            <span>{c.status}</span>
                          </span>

                          {summaryMeta && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSummary(summaryMeta);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-text)] hover:border-[var(--color-primary-border)] text-[11px] font-semibold text-[var(--color-text-main)] transition-colors cursor-pointer"
                              title="View Offline-Cached Contract Summary"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>Summary</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCSV([c], `contract_${c.code.toLowerCase()}`);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
                            title={`Export ${c.name} as CSV`}
                          >
                            <Download className="w-3 h-3 shrink-0" />
                            <span>CSV</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE STACKED CARDS VIEW (< 640px) */}
        <div className="sm:hidden divide-y divide-[var(--color-border)]">
          {filteredContracts.map((c) => {
            const summaryMeta = summaries[c.id];
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/contracts/${c.id}/analysis`)}
                className="p-3.5 hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-hover)] cursor-pointer transition-colors space-y-2 min-h-[44px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span className="font-semibold text-xs text-[var(--color-text-main)] truncate">
                      {c.name}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      c.status === "Active"
                        ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                        : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                  {c.counterparty} • <span className="font-mono">{c.code}</span>
                </div>

                {summaryMeta?.executiveSummary && (
                  <p className="text-[11px] text-[var(--color-text-subtle)] line-clamp-2">
                    {summaryMeta.executiveSummary}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--color-border-subtle)]">
                  <span className="text-[11px] text-[var(--color-primary-text)] font-medium">
                    {c.obligationsCount} obligations • Next:{" "}
                    {c.nextDeadlineToDisplay}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {summaryMeta && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSummary(summaryMeta);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[11px] font-semibold text-[var(--color-primary-text)]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Summary</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCSV([c], `contract_${c.code.toLowerCase()}`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[11px] font-semibold text-[var(--color-text-main)]"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[var(--color-text-muted)]">
          <span>
            Showing {filteredContracts.length} of {contracts.length} agreements ({cacheSource} cache ready for offline CSV reporting)
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleExportCSV(filteredContracts)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-text)] hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Offline CSV ({filteredContracts.length})</span>
            </button>
            {filteredContracts.length !== contracts.length && (
              <button
                type="button"
                onClick={() => handleExportCSV(contracts, "contracts_full_registry")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-text-main)] hover:underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All ({contracts.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offline-Ready Contract Summary Modal */}
      <ContractSummaryModal
        summary={selectedSummary}
        isOpen={Boolean(selectedSummary)}
        onClose={() => setSelectedSummary(null)}
        onOpenFullAnalysis={(contractId) =>
          navigate(`/contracts/${contractId}/analysis`)
        }
        isOfflineMode={isOfflineMode}
        cacheSource={cacheSource}
        syncedAt={syncedAt}
      />
    </div>
  );
};
