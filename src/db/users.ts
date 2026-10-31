import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { isAdminEmail } from "../config/admins";

export interface UserPreferencesPayload {
  emailAlertsEnabled?: boolean;
  deadlineAlertLeadHours?: number;
  highRiskAlertsOnly?: boolean;
  dailyDigestEnabled?: boolean;
}

export async function syncUser(
  user: {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
  },
  preferences?: UserPreferencesPayload
) {
  const email = user.email || "";
  const isAdmin = isAdminEmail(email);
  const role = isAdmin ? "Admin" : "Member";
  const department = isAdmin ? "Platform Governance" : "Operations & Procurement";

  const updateFields: Record<string, unknown> = {
    email,
    displayName: user.name || null,
    photoUrl: user.picture || null,
    role,
    department,
    updatedAt: new Date(),
  };

  if (typeof preferences?.emailAlertsEnabled === "boolean") {
    updateFields.emailAlertsEnabled = preferences.emailAlertsEnabled;
  }
  if (typeof preferences?.deadlineAlertLeadHours === "number") {
    updateFields.deadlineAlertLeadHours = preferences.deadlineAlertLeadHours;
  }
  if (typeof preferences?.highRiskAlertsOnly === "boolean") {
    updateFields.highRiskAlertsOnly = preferences.highRiskAlertsOnly;
  }
  if (typeof preferences?.dailyDigestEnabled === "boolean") {
    updateFields.dailyDigestEnabled = preferences.dailyDigestEnabled;
  }

  const [syncedUser] = await db
    .insert(users)
    .values({
      uid: user.uid,
      email,
      displayName: user.name || null,
      photoUrl: user.picture || null,
      role,
      department,
      emailAlertsEnabled: preferences?.emailAlertsEnabled ?? true,
      deadlineAlertLeadHours: preferences?.deadlineAlertLeadHours ?? 48,
      highRiskAlertsOnly: preferences?.highRiskAlertsOnly ?? false,
      dailyDigestEnabled: preferences?.dailyDigestEnabled ?? true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: updateFields,
    })
    .returning();

  return syncedUser;
}

export async function getUserPreferencesFromDb(uid: string) {
  const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  return rows[0] || null;
}

export async function updateUserPreferencesInDb(
  uid: string,
  email: string,
  name: string | undefined,
  preferences: UserPreferencesPayload
) {
  return syncUser(
    {
      uid,
      email,
      name,
    },
    preferences
  );
}
