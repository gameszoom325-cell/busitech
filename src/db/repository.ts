import { eq, desc } from "drizzle-orm";
import { db } from "./index.ts";
import {
  contracts,
  obligations,
  approvals,
  activityLogs,
  users,
} from "./schema.ts";
import {
  MOCK_CONTRACTS,
  MOCK_OBLIGATIONS,
  MOCK_APPROVALS,
  MOCK_ACTIVITY_LOGS,
  MOCK_USERS,
} from "../data/mockData.ts";
import {
  Contract,
  Obligation,
  ApprovalItem,
  ActivityEvent,
  ObligationStatus,
  RiskLevel,
  ObligationCategory,
} from "../types/index.ts";

let isSeeded = false;
let seedingPromise: Promise<void> | null = null;

/**
 * Lazily seeds the Cloud SQL database on first request if the tables are empty.
 * Never runs eagerly at startup (per Cloud SQL scale-to-zero best practices).
 */
export async function ensureSeeded(): Promise<void> {
  if (isSeeded) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const existingContracts = await db.select().from(contracts).limit(1);
      if (existingContracts.length === 0) {
        // Seed initial users
        for (const u of MOCK_USERS) {
          await db
            .insert(users)
            .values({
              uid: u.id,
              email: u.email,
              displayName: u.name,
              photoUrl: u.picture || null,
              role: u.role,
              department: u.department || "Operations & Procurement",
            })
            .onConflictDoNothing();
        }

        // Seed initial contracts
        for (const c of MOCK_CONTRACTS) {
          await db
            .insert(contracts)
            .values({
              id: c.id,
              name: c.name,
              code: c.code,
              counterparty: c.counterparty,
              type: c.type,
              obligationsCount: c.obligationsCount,
              hasRisk: Boolean(c.hasRisk),
              riskCount: c.riskCount ?? 0,
              nextDeadline: c.nextDeadline,
              nextDeadlineToDisplay: c.nextDeadlineToDisplay,
              status: c.status,
              fileSize: c.fileSize || null,
              uploadedDate: c.uploadedDate,
            })
            .onConflictDoNothing();
        }

        // Seed initial obligations
        for (const o of MOCK_OBLIGATIONS) {
          await db
            .insert(obligations)
            .values({
              id: o.id,
              title: o.title,
              tag: o.tag || null,
              clauseRef: o.clauseRef,
              description: o.description,
              contractId: o.contractId,
              contractName: o.contractName,
              ownerName: o.ownerName,
              ownerAvatar: o.ownerAvatar || null,
              dueDate: o.dueDate,
              dueDateFormatted: o.dueDateFormatted,
              status: o.status,
              risk: o.risk,
              category: o.category,
              isOverdue: Boolean(o.isOverdue),
              overdueText: o.overdueText || null,
              responsibleParty: o.responsibleParty,
              verificationStatus: o.verificationStatus || "Verified",
              section: o.section || null,
              pageLine: o.pageLine || null,
              noticeThreshold: o.noticeThreshold || null,
              cadence: o.cadence || null,
            })
            .onConflictDoNothing();
        }

        // Seed initial approvals
        for (const a of MOCK_APPROVALS) {
          await db
            .insert(approvals)
            .values({
              id: a.id,
              title: a.title,
              riskLevel: a.riskLevel,
              riskScore: a.riskScore || null,
              riskDotColor: a.riskDotColor,
              dueDateTag: a.dueDateTag,
              contractRef: a.contractRef,
              clauseRef: a.clauseRef,
              description: a.description,
              contractualBasisQuote: a.contractualBasisQuote,
              basisMatchPercent: a.basisMatchPercent || null,
              actionsJson: JSON.stringify(a.actions || []),
              primaryButtonLabel: a.primaryButtonLabel,
              secondaryButtonLabel: a.secondaryButtonLabel || null,
              thirdButtonLabel: a.thirdButtonLabel || null,
              status: a.status,
              resolvedBy: a.resolvedBy || null,
              resolvedAt: a.resolvedAt || null,
            })
            .onConflictDoNothing();
        }

        // Seed initial activity logs
        for (const log of MOCK_ACTIVITY_LOGS) {
          await db
            .insert(activityLogs)
            .values({
              id: log.id,
              timestamp: log.timestamp,
              userName: log.userName,
              userRole: log.userRole,
              action: log.action,
              target: log.target,
              hash: log.hash,
              category: log.category,
            })
            .onConflictDoNothing();
        }
      }
      isSeeded = true;
    } catch (error) {
      console.warn("[Cloud SQL Seed] Deferred or fallback active:", error);
    } finally {
      seedingPromise = null;
    }
  })();

  return seedingPromise;
}

export async function getContractsFromDb(): Promise<Contract[]> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(contracts)
      .orderBy(desc(contracts.createdAt));

    if (rows.length === 0) return MOCK_CONTRACTS;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      counterparty: r.counterparty,
      type: r.type,
      obligationsCount: r.obligationsCount,
      hasRisk: Boolean(r.hasRisk),
      riskCount: r.riskCount ?? undefined,
      nextDeadline: r.nextDeadline,
      nextDeadlineToDisplay: r.nextDeadlineToDisplay,
      status: r.status as Contract["status"],
      fileSize: r.fileSize ?? undefined,
      uploadedDate: r.uploadedDate,
    }));
  } catch (error) {
    console.warn("[Cloud SQL] getContractsFromDb fallback:", error);
    return MOCK_CONTRACTS;
  }
}

export async function upsertContractInDb(
  contract: Contract,
  ownerUid?: string
): Promise<Contract> {
  try {
    await ensureSeeded();
    await db
      .insert(contracts)
      .values({
        id: contract.id,
        name: contract.name,
        code: contract.code,
        counterparty: contract.counterparty,
        type: contract.type,
        obligationsCount: contract.obligationsCount,
        hasRisk: Boolean(contract.hasRisk),
        riskCount: contract.riskCount ?? 0,
        nextDeadline: contract.nextDeadline,
        nextDeadlineToDisplay: contract.nextDeadlineToDisplay,
        status: contract.status,
        fileSize: contract.fileSize || null,
        uploadedDate: contract.uploadedDate,
        ownerUid: ownerUid || null,
      })
      .onConflictDoUpdate({
        target: contracts.id,
        set: {
          name: contract.name,
          code: contract.code,
          counterparty: contract.counterparty,
          type: contract.type,
          obligationsCount: contract.obligationsCount,
          hasRisk: Boolean(contract.hasRisk),
          riskCount: contract.riskCount ?? 0,
          nextDeadline: contract.nextDeadline,
          nextDeadlineToDisplay: contract.nextDeadlineToDisplay,
          status: contract.status,
          fileSize: contract.fileSize || null,
          uploadedDate: contract.uploadedDate,
        },
      });
  } catch (error) {
    console.warn("[Cloud SQL] upsertContractInDb error:", error);
  }
  return contract;
}

export async function getObligationsFromDb(): Promise<Obligation[]> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(obligations)
      .orderBy(desc(obligations.createdAt));

    if (rows.length === 0) return MOCK_OBLIGATIONS;

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      tag: r.tag ?? undefined,
      clauseRef: r.clauseRef,
      description: r.description,
      contractId: r.contractId,
      contractName: r.contractName,
      ownerName: r.ownerName,
      ownerAvatar: r.ownerAvatar ?? undefined,
      dueDate: r.dueDate,
      dueDateFormatted: r.dueDateFormatted,
      status: r.status as ObligationStatus,
      risk: r.risk as RiskLevel,
      category: r.category as ObligationCategory,
      isOverdue: Boolean(r.isOverdue),
      overdueText: r.overdueText ?? undefined,
      responsibleParty: r.responsibleParty,
      verificationStatus:
        (r.verificationStatus as Obligation["verificationStatus"]) ?? "Verified",
      section: r.section ?? undefined,
      pageLine: r.pageLine ?? undefined,
      noticeThreshold: r.noticeThreshold ?? undefined,
      cadence: r.cadence ?? undefined,
    }));
  } catch (error) {
    console.warn("[Cloud SQL] getObligationsFromDb fallback:", error);
    return MOCK_OBLIGATIONS;
  }
}

export async function upsertObligationInDb(
  obligation: Obligation
): Promise<Obligation> {
  try {
    await ensureSeeded();
    await db
      .insert(obligations)
      .values({
        id: obligation.id,
        title: obligation.title,
        tag: obligation.tag || null,
        clauseRef: obligation.clauseRef,
        description: obligation.description,
        contractId: obligation.contractId,
        contractName: obligation.contractName,
        ownerName: obligation.ownerName,
        ownerAvatar: obligation.ownerAvatar || null,
        dueDate: obligation.dueDate,
        dueDateFormatted: obligation.dueDateFormatted,
        status: obligation.status,
        risk: obligation.risk,
        category: obligation.category,
        isOverdue: Boolean(obligation.isOverdue),
        overdueText: obligation.overdueText || null,
        responsibleParty: obligation.responsibleParty,
        verificationStatus: obligation.verificationStatus || "Verified",
        section: obligation.section || null,
        pageLine: obligation.pageLine || null,
        noticeThreshold: obligation.noticeThreshold || null,
        cadence: obligation.cadence || null,
      })
      .onConflictDoUpdate({
        target: obligations.id,
        set: {
          title: obligation.title,
          status: obligation.status,
          risk: obligation.risk,
          ownerName: obligation.ownerName,
          dueDate: obligation.dueDate,
          dueDateFormatted: obligation.dueDateFormatted,
          isOverdue: Boolean(obligation.isOverdue),
          overdueText: obligation.overdueText || null,
        },
      });
  } catch (error) {
    console.warn("[Cloud SQL] upsertObligationInDb error:", error);
  }
  return obligation;
}

export async function getApprovalsFromDb(): Promise<ApprovalItem[]> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(approvals)
      .orderBy(desc(approvals.createdAt));

    if (rows.length === 0) return MOCK_APPROVALS;

    return rows.map((r) => {
      let actions: string[] = [];
      try {
        actions = JSON.parse(r.actionsJson);
      } catch {
        actions = [];
      }
      return {
        id: r.id,
        title: r.title,
        riskLevel: r.riskLevel as ApprovalItem["riskLevel"],
        riskScore: r.riskScore ?? undefined,
        riskDotColor: r.riskDotColor as ApprovalItem["riskDotColor"],
        dueDateTag: r.dueDateTag,
        contractRef: r.contractRef,
        clauseRef: r.clauseRef,
        description: r.description,
        contractualBasisQuote: r.contractualBasisQuote,
        basisMatchPercent: r.basisMatchPercent ?? undefined,
        actions,
        primaryButtonLabel: r.primaryButtonLabel,
        secondaryButtonLabel: r.secondaryButtonLabel ?? undefined,
        thirdButtonLabel: r.thirdButtonLabel ?? undefined,
        status: r.status as ApprovalItem["status"],
        resolvedBy: r.resolvedBy ?? undefined,
        resolvedAt: r.resolvedAt ?? undefined,
      };
    });
  } catch (error) {
    console.warn("[Cloud SQL] getApprovalsFromDb fallback:", error);
    return MOCK_APPROVALS;
  }
}

export async function updateApprovalStatusInDb(
  id: string,
  status: ApprovalItem["status"],
  resolvedBy?: string,
  resolvedAt?: string
): Promise<void> {
  try {
    await ensureSeeded();
    await db
      .update(approvals)
      .set({
        status,
        resolvedBy: resolvedBy || null,
        resolvedAt: resolvedAt || new Date().toISOString(),
      })
      .where(eq(approvals.id, id));
  } catch (error) {
    console.warn("[Cloud SQL] updateApprovalStatusInDb error:", error);
  }
}

export async function getActivityLogsFromDb(): Promise<ActivityEvent[]> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt));

    if (rows.length === 0) return MOCK_ACTIVITY_LOGS;

    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      userName: r.userName,
      userRole: r.userRole,
      action: r.action,
      target: r.target,
      hash: r.hash,
      category: r.category as ActivityEvent["category"],
    }));
  } catch (error) {
    console.warn("[Cloud SQL] getActivityLogsFromDb fallback:", error);
    return MOCK_ACTIVITY_LOGS;
  }
}

export async function appendActivityLogInDb(
  event: ActivityEvent
): Promise<ActivityEvent> {
  try {
    await ensureSeeded();
    await db
      .insert(activityLogs)
      .values({
        id: event.id,
        timestamp: event.timestamp,
        userName: event.userName,
        userRole: event.userRole,
        action: event.action,
        target: event.target,
        hash: event.hash,
        category: event.category,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.warn("[Cloud SQL] appendActivityLogInDb error:", error);
  }
  return event;
}
