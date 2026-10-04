import { ADMIN_UID, UserRole } from '../types';

/**
 * STORED ROLE-BASED ACCESS CONTROL (RBAC) CONFIGURATION
 * 
 * Strict access control lists. Substring matching (e.g. email.includes('admin'))
 * is strictly forbidden to prevent unauthorized privilege escalation.
 */

// Stored authorized store administrator email addresses
const STORED_ADMIN_EMAILS: string[] = [
  'kakoozajoel45@gmail.com',
  'uk1ug@admin.com',
];

// Stored authorized dispatch rider email addresses
const STORED_RIDER_EMAILS: string[] = [
  'uk1ug@rider.com',
];

/**
 * Returns normalized array of authorized administrator emails
 */
export function getAdminEmails(): string[] {
  const envAdmin = (import.meta.env.VITE_ADMIN_EMAIL || (import.meta.env as any).ADMIN_EMAIL || '').toLowerCase().trim();
  const list = [...STORED_ADMIN_EMAILS];
  if (envAdmin && !list.includes(envAdmin)) {
    list.push(envAdmin);
  }
  return list.map((e) => e.toLowerCase().trim());
}

/**
 * Returns normalized array of authorized fulfillment rider emails
 */
export function getRiderEmails(): string[] {
  const envRider = (import.meta.env.VITE_RIDER_EMAIL || (import.meta.env as any).RIDER_EMAIL || '').toLowerCase().trim();
  const list = [...STORED_RIDER_EMAILS];
  if (envRider && !list.includes(envRider)) {
    list.push(envRider);
  }
  return list.map((e) => e.toLowerCase().trim());
}

/**
 * Evaluates whether a user identity holds the Admin role.
 * Strictly verifies against ADMIN_UID or exact stored admin email address.
 */
export function isAdminUser(email?: string | null, uid?: string | null): boolean {
  if (uid && uid === ADMIN_UID) return true;
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const admins = getAdminEmails();
  return admins.includes(cleanEmail);
}

/**
 * Evaluates whether a user identity holds the Rider / Driver role.
 * Strictly verifies against exact stored rider email address.
 */
export function isRiderUser(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const riders = getRiderEmails();
  return riders.includes(cleanEmail);
}

/**
 * Centralized RBAC Role Determination
 * 
 * Evaluates credentials and returns:
 * - 'admin': if email or UID is in the authorized admin list
 * - 'driver': if email is in the authorized dispatch rider list
 * - 'customer': for any other user account
 */
export function determineRole(email?: string | null, uid?: string | null): UserRole {
  if (isAdminUser(email, uid)) return 'admin';
  if (isRiderUser(email)) return 'driver';
  return 'customer';
}

/**
 * Portal Access Guard Check
 * Enforces role-based permissions per portal route
 */
export function canAccessPortal(role: UserRole | undefined, portal: 'customer' | 'admin' | 'driver'): boolean {
  if (portal === 'customer') return true;
  if (portal === 'admin') return role === 'admin';
  if (portal === 'driver') return role === 'driver' || role === 'admin';
  return false;
}
