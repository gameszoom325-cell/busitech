import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { MOCK_OBLIGATIONS } from '../data/mockData';
import { Obligation } from '../types';

export interface UpcomingDeadlineItem {
  obligation: Obligation;
  hoursRemaining: number;
  expiresAt: Date;
  urgency: 'critical' | 'warning' | 'normal';
}

export interface UseUpcomingDeadlinesOptions {
  obligations?: Obligation[];
  windowHours?: number;
  referenceDate?: Date;
  autoNotify?: boolean;
}

const NOTIFIED_STORAGE_KEY = 'c2a-notified-deadlines-48h';

/**
 * Parses an obligation's dueDate into a concrete expiration Date.
 * Supports real ISO/YYYY-MM-DD dates as well as the demo dataset's relative "Tomorrow"/"Today" markers.
 */
export function resolveObligationDeadline(
  obligation: Obligation,
  now: Date = new Date()
): Date | null {
  const formattedLower = (obligation.dueDateFormatted || '').toLowerCase();

  // Check if dueDate is a valid date string
  if (obligation.dueDate) {
    const raw = obligation.dueDate.trim();
    // If YYYY-MM-DD format, parse as end of that day in local time (23:59:59)
    const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const month = Number(ymdMatch[2]) - 1;
      const day = Number(ymdMatch[3]);
      const parsed = new Date(year, month, day, 23, 59, 59, 999);

      // If the obligation is part of the static demo dataset with a "Tomorrow" or "Today" label
      // and the hardcoded year is in the past, anchor it relative to `now` so demo obligations
      // accurately reflect their 48-hour expiration window.
      if (parsed.getTime() < now.getTime() && !obligation.isOverdue && obligation.status !== 'Overdue') {
        if (formattedLower.includes('today')) {
          return new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
        }
        if (formattedLower.includes('tomorrow')) {
          return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        }
        const daysMatch = /\((\d+)d\)/.exec(formattedLower);
        if (daysMatch) {
          const days = Number(daysMatch[1]);
          return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        }
      }

      return parsed;
    }

    const parsedIso = new Date(raw);
    if (!isNaN(parsedIso.getTime())) {
      return parsedIso;
    }
  }

  return null;
}

/**
 * Hook that calculates upcoming contract deadlines and triggers Toast notifications
 * via ToastContext for any active obligation expiring within the next 48 hours.
 */
export function useUpcomingDeadlines(options: UseUpcomingDeadlinesOptions = {}) {
  const {
    obligations: externalObligations,
    windowHours = 48,
    referenceDate,
    autoNotify = true
  } = options;

  const { showToast } = useToast();
  const [refreshTick, setRefreshTick] = useState(0);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Hydrate already-notified obligation IDs from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(NOTIFIED_STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        parsed.forEach(id => notifiedIdsRef.current.add(id));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Listen for obligation mutations from AI tools or manual modal additions
  useEffect(() => {
    const handleDataUpdated = () => {
      setRefreshTick(t => t + 1);
    };
    window.addEventListener('c2a:data-updated', handleDataUpdated);
    return () => window.removeEventListener('c2a:data-updated', handleDataUpdated);
  }, []);

  const sourceObligations = externalObligations ?? MOCK_OBLIGATIONS;

  const {
    expiringWithinWindow,
    upcomingDeadlines,
    overdueDeadlines
  } = useMemo(() => {
    const now = referenceDate ?? new Date();
    const nowMs = now.getTime();
    const windowMs = windowHours * 60 * 60 * 1000;

    const expiring: UpcomingDeadlineItem[] = [];
    const upcoming: UpcomingDeadlineItem[] = [];
    const overdue: UpcomingDeadlineItem[] = [];

    for (const ob of sourceObligations) {
      if (ob.status === 'Completed') continue;

      const expiresAt = resolveObligationDeadline(ob, now);
      if (!expiresAt) continue;

      const diffMs = expiresAt.getTime() - nowMs;
      const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

      if (ob.status === 'Overdue' || ob.isOverdue || diffMs <= 0) {
        overdue.push({
          obligation: ob,
          hoursRemaining,
          expiresAt,
          urgency: 'critical'
        });
        continue;
      }

      const urgency: 'critical' | 'warning' | 'normal' =
        hoursRemaining <= 24
          ? 'critical'
          : hoursRemaining <= windowHours
          ? 'warning'
          : 'normal';

      const item: UpcomingDeadlineItem = {
        obligation: ob,
        hoursRemaining,
        expiresAt,
        urgency
      };

      upcoming.push(item);

      if (diffMs > 0 && diffMs <= windowMs) {
        expiring.push(item);
      }
    }

    expiring.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    upcoming.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    overdue.sort((a, b) => a.hoursRemaining - b.hoursRemaining);

    return {
      expiringWithinWindow: expiring,
      upcomingDeadlines: upcoming,
      overdueDeadlines: overdue
    };
  }, [sourceObligations, windowHours, referenceDate, refreshTick]);

  /**
   * Triggers Toast notifications via ToastContext for any obligation expiring within the window
   */
  const notifyExpiringDeadlines = useCallback(
    (forceAll: boolean = false) => {
      let triggeredCount = 0;

      for (const item of expiringWithinWindow) {
        const obId = item.obligation.id;
        if (!forceAll && notifiedIdsRef.current.has(obId)) {
          continue;
        }

        notifiedIdsRef.current.add(obId);
        triggeredCount++;

        const roundedHours = Math.max(1, Math.ceil(item.hoursRemaining));
        showToast(
          `Deadline Alert (${roundedHours}h left): "${item.obligation.title}" • ${item.obligation.contractName}`,
          'warning'
        );
      }

      if (triggeredCount > 0) {
        try {
          sessionStorage.setItem(
            NOTIFIED_STORAGE_KEY,
            JSON.stringify(Array.from(notifiedIdsRef.current))
          );
        } catch {
          // ignore storage errors
        }
      }

      return triggeredCount;
    },
    [expiringWithinWindow, showToast]
  );

  // Automatically notify when obligations enter the 48-hour expiration window
  useEffect(() => {
    if (!autoNotify || expiringWithinWindow.length === 0) return;
    notifyExpiringDeadlines(false);
  }, [autoNotify, expiringWithinWindow, notifyExpiringDeadlines]);

  return {
    expiringWithin48Hours: expiringWithinWindow,
    upcomingDeadlines,
    overdueDeadlines,
    notifyExpiringDeadlines
  };
}
