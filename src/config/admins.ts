/**
 * PHASE 1 MOCK ONLY: in phase 2 this check moves to the server (ADMIN_EMAILS env var),
 * because client-side checks can be bypassed.
 *
 * Authorized Administrator Emails:
 * - aspging@gmail.com
 * - gameszoom325@gmail.com
 * - Ayushdps2020@gmail.com
 */
export const ADMIN_EMAILS: readonly string[] = [
  'aspging@gmail.com',
  'gameszoom325@gmail.com',
  'Ayushdps2020@gmail.com',
  'ayushdps1010@gmail.com' // Preserved for backwards compatibility with initial seed
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(admin => admin.toLowerCase() === cleanEmail);
}
