import { jsPDF } from 'jspdf';
import {
  MOCK_CONTRACTS,
  MOCK_OBLIGATIONS,
  MOCK_APPROVALS,
  RISK_DISTRIBUTION_DATA
} from '../data/mockData';
import { Contract, Obligation, ApprovalItem } from '../types';
import {
  ContractSummaryMetadata,
  buildContractMetadataPayload
} from './contractCache';
import {
  downloadContractsFromState,
  convertContractsToCSVString,
  triggerCSVBrowserDownload
} from '../utils/csvExport';

export {
  downloadContractsFromState,
  convertContractsToCSVString,
  triggerCSVBrowserDownload
};

export interface SmartExportOptions {
  format: 'pdf' | 'csv';
  includeContracts: boolean;
  includeObligations: boolean;
  includeRiskAssessment: boolean;
  contractFilterId?: string; // 'ALL' or specific contract ID
  customContracts?: Contract[];
  customObligations?: Obligation[];
  customApprovals?: ApprovalItem[];
  reportTitle?: string;
}

export interface ContractsCsvExportOptions {
  contracts?: Contract[];
  summaries?: Record<string, ContractSummaryMetadata>;
  fileNamePrefix?: string;
  cacheSource?: string;
  syncedAt?: string;
  filterDescription?: string;
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports the contracts list (filtered or full registry) as an offline-ready UTF-8 CSV file
 * enriched with cached executive summaries, governing law, renewal terms, key clauses, and obligations preview.
 */
export function exportContractsListToCSV(
  options: ContractsCsvExportOptions = {}
): { fileName: string; rowCount: number; csvString: string } {
  const fallbackPayload = buildContractMetadataPayload(
    MOCK_CONTRACTS,
    MOCK_OBLIGATIONS,
    'local-storage'
  );

  const contractsList =
    options.contracts !== undefined
      ? options.contracts
      : fallbackPayload.contracts;
  const summariesMap = options.summaries || fallbackPayload.summaries;

  return downloadContractsFromState(contractsList, summariesMap, {
    fileNamePrefix: options.fileNamePrefix || 'contracts_offline_report',
    cacheSource: options.cacheSource || fallbackPayload.source || 'offline-cache',
    syncedAt: options.syncedAt || fallbackPayload.syncedAt
  });
}

/**
 * Generates and downloads a formatted CSV report containing selected sections:
 * Risk Assessments, Contract Summaries, and Extracted Obligations.
 */
export function generateSmartCSV(options: SmartExportOptions): string {
  const contractsSource = options.customContracts ?? MOCK_CONTRACTS;
  const obligationsSource = options.customObligations ?? MOCK_OBLIGATIONS;
  const approvalsSource = options.customApprovals ?? MOCK_APPROVALS;

  const targetContract =
    options.contractFilterId && options.contractFilterId !== 'ALL'
      ? contractsSource.find(c => c.id === options.contractFilterId)
      : undefined;

  const contracts = targetContract ? [targetContract] : contractsSource;
  const obligations = targetContract
    ? obligationsSource.filter(
        o =>
          o.contractId === targetContract.id ||
          o.contractName.toLowerCase().includes(targetContract.counterparty.toLowerCase().split(' ')[0])
      )
    : obligationsSource;

  const lines: string[] = [];
  const timestamp = new Date().toISOString();

  lines.push(
    escapeCsvCell(
      options.reportTitle || 'Contract2Action AI — Smart Governance Export Report'
    )
  );
  lines.push(`Generated At,${escapeCsvCell(timestamp)}`);
  lines.push(
    `Scope,${escapeCsvCell(
      targetContract ? `${targetContract.name} (${targetContract.code})` : 'Full Enterprise Portfolio'
    )}`
  );
  lines.push('');

  // 1. Risk Assessment Section
  if (options.includeRiskAssessment) {
    const highRiskObs = obligations.filter(o => o.risk === 'High').length;
    const overdueObs = obligations.filter(
      o => o.status === 'Overdue' || o.isOverdue
    ).length;
    const pendingApprovals = approvalsSource.filter(
      a => a.status === 'Pending'
    );

    lines.push('=== SECTION 1: PORTFOLIO RISK ASSESSMENT & TELEMETRY ===');
    lines.push('Metric,Value,Notes');
    lines.push(`Total Contracts Evaluated,${contracts.length},Active & Pending Review`);
    lines.push(`Total Tracked Obligations,${obligations.length},Extracted commitments`);
    lines.push(`High Risk Obligations,${highRiskObs},Requires priority monitoring`);
    lines.push(`Overdue Obligations,${overdueObs},Immediate remediation needed`);
    lines.push(`Pending Human-Gate Approvals,${pendingApprovals.length},Awaiting executive sign-off`);
    lines.push('Compliance Rate,96.4%,Portfolio SLA & audit adherence');
    lines.push('');

    lines.push('Risk Tier Distribution,Count,Share (%)');
    for (const r of RISK_DISTRIBUTION_DATA) {
      lines.push(`${escapeCsvCell(r.level)},${r.count},${r.percent}%`);
    }
    lines.push('');

    if (pendingApprovals.length > 0) {
      lines.push('Approval ID,Title,Risk Level,Contract Reference,Clause,Due Date,Status');
      for (const app of pendingApprovals) {
        lines.push(
          [
            escapeCsvCell(app.id),
            escapeCsvCell(app.title),
            escapeCsvCell(app.riskLevel),
            escapeCsvCell(app.contractRef),
            escapeCsvCell(app.clauseRef),
            escapeCsvCell(app.dueDateTag),
            escapeCsvCell(app.status)
          ].join(',')
        );
      }
      lines.push('');
    }
  }

  // 2. Contract Summaries Section
  if (options.includeContracts) {
    lines.push('=== SECTION 2: CONTRACT SUMMARIES ===');
    lines.push(
      'Contract Name,Contract Code,Counterparty,Category,Extracted Obligations,Risk Flag,Next Deadline,Status'
    );
    for (const c of contracts) {
      lines.push(
        [
          escapeCsvCell(c.name),
          escapeCsvCell(c.code),
          escapeCsvCell(c.counterparty),
          escapeCsvCell(c.type),
          c.obligationsCount,
          c.hasRisk ? `Flagged (${c.riskCount || 1})` : 'Clear',
          escapeCsvCell(c.nextDeadline),
          escapeCsvCell(c.status)
        ].join(',')
      );
    }
    lines.push('');
  }

  // 3. Extracted Obligations Section
  if (options.includeObligations) {
    lines.push('=== SECTION 3: EXTRACTED OBLIGATIONS & DEADLINES ===');
    lines.push(
      'Obligation ID,Title,Contract Name,Clause Reference,Category,Owner,Due Date,Status,Risk Level,Responsible Party,Description'
    );
    for (const o of obligations) {
      lines.push(
        [
          escapeCsvCell(o.id),
          escapeCsvCell(o.title),
          escapeCsvCell(o.contractName),
          escapeCsvCell(o.clauseRef),
          escapeCsvCell(o.category),
          escapeCsvCell(o.ownerName),
          escapeCsvCell(o.dueDate),
          escapeCsvCell(o.status),
          escapeCsvCell(o.risk),
          escapeCsvCell(o.responsibleParty),
          escapeCsvCell(o.description)
        ].join(',')
      );
    }
    lines.push('');
  }

  const csvString = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const fileName = `c2a_smart_report_${new Date().toISOString().slice(0, 10)}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return fileName;
}

/**
 * Generates and downloads a formatted multi-section PDF executive report using jsPDF.
 */
export function generateSmartPDF(options: SmartExportOptions): string {
  const contractsSource = options.customContracts ?? MOCK_CONTRACTS;
  const obligationsSource = options.customObligations ?? MOCK_OBLIGATIONS;
  const approvalsSource = options.customApprovals ?? MOCK_APPROVALS;

  const targetContract =
    options.contractFilterId && options.contractFilterId !== 'ALL'
      ? contractsSource.find(c => c.id === options.contractFilterId)
      : undefined;

  const contracts = targetContract ? [targetContract] : contractsSource;
  const obligations = targetContract
    ? obligationsSource.filter(
        o =>
          o.contractId === targetContract.id ||
          o.contractName.toLowerCase().includes(targetContract.counterparty.toLowerCase().split(' ')[0])
      )
    : obligationsSource;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  // Top Branded Banner
  doc.setFillColor(37, 99, 235); // Primary #2563eb
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(
    options.reportTitle || 'Contract2Action AI • Smart Governance Report',
    margin + 6,
    y + 10
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const scopeLabel = targetContract
    ? `Scope: ${targetContract.name} (${targetContract.code})`
    : 'Scope: Full Enterprise Portfolio (Contracts, Obligations & Risk Assessment)';
  doc.text(scopeLabel, margin + 6, y + 16.5);
  doc.text(
    `Generated: ${new Date().toLocaleString()} • Audit ID: C2A-${Math.random()
      .toString(16)
      .substring(2, 8)
      .toUpperCase()}`,
    margin + 6,
    y + 21
  );

  y += 31;

  // SECTION 1: Risk Assessment & Portfolio Telemetry
  if (options.includeRiskAssessment) {
    ensureSpace(46);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Executive Risk Assessment & Portfolio Summary', margin, y);
    y += 5;

    const highRiskCount = obligations.filter(o => o.risk === 'High').length;
    const mediumRiskCount = obligations.filter(o => o.risk === 'Medium').length;
    const lowRiskCount = obligations.filter(o => o.risk === 'Low').length;
    const overdueCount = obligations.filter(
      o => o.status === 'Overdue' || o.isOverdue
    ).length;
    const pendingApprovals = approvalsSource.filter(
      a => a.status === 'Pending'
    );

    // 4 Metric Boxes
    const boxW = (contentWidth - 9) / 4;
    const metrics = [
      { label: 'CONTRACTS', val: String(contracts.length), sub: 'Evaluated' },
      { label: 'OBLIGATIONS', val: String(obligations.length), sub: `${overdueCount} Overdue` },
      { label: 'HIGH RISK', val: String(highRiskCount), sub: `${mediumRiskCount} Med / ${lowRiskCount} Low` },
      { label: 'COMPLIANCE', val: '96.4%', sub: `${pendingApprovals.length} Approvals Pending` }
    ];

    metrics.forEach((m, idx) => {
      const bx = margin + idx * (boxW + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(bx, y, boxW, 18, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(m.label, bx + 3, y + 5);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(m.val, bx + 3, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(m.sub, bx + 3, y + 16);
    });

    y += 23;

    // Pending Human-Gate Approvals Table
    if (pendingApprovals.length > 0) {
      ensureSpace(22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Pending Human-in-the-Loop Approvals & Risk Exposure:', margin, y);
      y += 4;

      for (const app of pendingApprovals) {
        ensureSpace(16);
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
        doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text(`[${app.riskLevel}] ${app.title}`, margin + 3, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(
          `${app.contractRef} • ${app.clauseRef} • Due: ${app.dueDateTag}`,
          margin + 3,
          y + 9.5
        );
        const descSnippet = doc.splitTextToSize(app.description, contentWidth - 6)[0];
        doc.text(descSnippet || '', margin + 3, y + 13);
        y += 16;
      }
      y += 3;
    }
  }

  // SECTION 2: Contract Summaries
  if (options.includeContracts) {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`2. Contract Summaries (${contracts.length})`, margin, y);
    y += 4;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('CONTRACT NAME & CODE', margin + 2, y + 4.8);
    doc.text('COUNTERPARTY', margin + 74, y + 4.8);
    doc.text('TYPE', margin + 114, y + 4.8);
    doc.text('OBLIGATIONS', margin + 148, y + 4.8);
    doc.text('STATUS', margin + 168, y + 4.8);
    y += 8.5;

    for (const c of contracts) {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${c.name.slice(0, 34)} (${c.code})`, margin + 2, y + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(c.counterparty.slice(0, 22), margin + 74, y + 3.5);
      doc.text(c.type.slice(0, 18), margin + 114, y + 3.5);
      doc.text(
        `${c.obligationsCount}${c.hasRisk ? ' (Risk!)' : ''}`,
        margin + 148,
        y + 3.5
      );
      doc.text(c.status, margin + 168, y + 3.5);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);
      y += 7.5;
    }

    y += 5;
  }

  // SECTION 3: Extracted Obligations
  if (options.includeObligations) {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `3. Extracted Obligations & Deadlines (${obligations.length})`,
      margin,
      y
    );
    y += 5;

    for (const ob of obligations) {
      ensureSpace(17);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 14.5, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${ob.title} [${ob.risk} Risk]`, margin + 3, y + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235);
      doc.text(
        `${ob.contractName} • ${ob.clauseRef} • Owner: ${ob.ownerName} • Due: ${ob.dueDate} • Status: ${ob.status}`,
        margin + 3,
        y + 9
      );

      doc.setTextColor(71, 85, 105);
      const wrappedDesc = doc.splitTextToSize(ob.description, contentWidth - 6);
      doc.text(wrappedDesc[0] || '', margin + 3, y + 13);

      y += 16.5;
    }
  }

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Contract2Action AI • Smart Export Report • Page ${p} of ${totalPages}`,
      margin,
      pageHeight - 8
    );
  }

  const fileName = `c2a_smart_report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
