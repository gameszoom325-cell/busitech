import {
  MOCK_CONTRACTS,
  MOCK_OBLIGATIONS,
  MOCK_ANALYSIS_OBLIGATIONS,
  MOCK_APPROVALS,
  MOCK_ACTIVITY_LOGS,
  MOCK_NOTIFICATIONS,
  MOCK_GUESTS,
  CATEGORY_CHART_DATA,
  RISK_DISTRIBUTION_DATA
} from '../data/mockData';
import { Contract, Obligation, ApprovalItem, ActivityEvent, NotificationItem, GuestRegistration } from '../types';
import { authService } from './auth';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Endpoint security verifier (Phase 1 Mock enforcement; Phase 2 verified via backend JWT/Session)
 */
function enforceSessionAuth(): void {
  const session = authService.getSession();
  if (!session) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('c2a:unauthorized'));
    }
    const err: any = new Error('HTTP 401 Unauthorized: Valid session required');
    err.status = 401;
    throw err;
  }
}

function enforceAdminRole(): void {
  enforceSessionAuth();
  const session = authService.getSession();
  if (session?.user?.role !== 'Admin') {
    const err: any = new Error('HTTP 403 Forbidden: Administrative role required');
    err.status = 403;
    throw err;
  }
}

export const api = {
  // Test helpers for QA and security audits
  triggerSimulated401() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('c2a:unauthorized'));
    }
    const err: any = new Error('Simulated HTTP 401 Unauthorized');
    err.status = 401;
    throw err;
  },

  triggerSimulated403() {
    const err: any = new Error('Simulated HTTP 403 Forbidden');
    err.status = 403;
    throw err;
  },

  async getOverviewStats() {
    enforceSessionAuth();
    await delay(120);
    return {
      activeContracts: 24,
      pendingApprovals: 3,
      upcomingDeadlines: 7,
      overdueObligations: 1,
      complianceRate: '96.4%'
    };
  },

  async getRecentContracts(): Promise<Contract[]> {
    enforceSessionAuth();
    await delay(120);
    return [...MOCK_CONTRACTS];
  },

  async getAllObligations(): Promise<Obligation[]> {
    enforceSessionAuth();
    await delay(150);
    return [...MOCK_OBLIGATIONS];
  },

  async addObligation(newObligation: Omit<Obligation, 'id'>): Promise<Obligation> {
    enforceSessionAuth();
    await delay(200);
    const created: Obligation = {
      ...newObligation,
      id: `ob_${Date.now()}`
    };
    MOCK_OBLIGATIONS.unshift(created);
    return created;
  },

  async getApprovals(): Promise<ApprovalItem[]> {
    enforceSessionAuth();
    await delay(120);
    return [...MOCK_APPROVALS];
  },

  async resolveApproval(id: string, action: 'Approved' | 'Rejected', comment?: string): Promise<ApprovalItem> {
    enforceSessionAuth();
    await delay(250);
    const item = MOCK_APPROVALS.find(a => a.id === id);
    if (!item) throw new Error('Approval item not found');
    item.status = action;
    item.resolvedAt = new Date().toISOString();
    
    const session = authService.getSession();
    const actorName = session?.user?.name || 'Authorized Lead';
    const actorRole = session?.user?.role || 'Approver';

    // Record in activity log
    MOCK_ACTIVITY_LOGS.unshift({
      id: `act_${Date.now()}`,
      timestamp: 'Just now',
      userName: actorName,
      userRole: actorRole,
      action: `${action}: ${item.title} ${comment ? `("${comment}")` : ''}`,
      target: `${item.contractRef} ${item.clauseRef}`,
      hash: Math.random().toString(16).substring(2, 8) + '...' + Math.random().toString(16).substring(2, 6),
      category: 'Approval'
    });
    return item;
  },

  async getAnalysisData(contractId: string) {
    enforceSessionAuth();
    await delay(150);
    return {
      contract: MOCK_CONTRACTS.find(c => c.id === contractId) || MOCK_CONTRACTS[0],
      obligations: [...MOCK_ANALYSIS_OBLIGATIONS],
      stats: {
        totalClauses: 48,
        pages: 19,
        actionableObligations: 6,
        confidenceScore: 94,
        thresholdPass: '5/6 passed threshold'
      }
    };
  },

  async getActivityLogs(): Promise<ActivityEvent[]> {
    enforceSessionAuth();
    await delay(120);
    return [...MOCK_ACTIVITY_LOGS];
  },

  async getNotifications(): Promise<NotificationItem[]> {
    enforceSessionAuth();
    await delay(80);
    return [...MOCK_NOTIFICATIONS];
  },

  /**
   * Guest registrations: Restricted to Administrators only
   */
  async getGuestRegistrations(): Promise<GuestRegistration[]> {
    enforceAdminRole();
    await delay(120);
    return [...MOCK_GUESTS];
  },

  async getInsightsData() {
    enforceSessionAuth();
    await delay(120);
    return {
      categoryData: CATEGORY_CHART_DATA,
      riskDistribution: RISK_DISTRIBUTION_DATA
    };
  }
};
