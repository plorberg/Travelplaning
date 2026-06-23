// Pure invitation rules (no DB) so they can be unit-tested in isolation.

export const INVITABLE_ROLES = ["editor", "viewer"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInvitableRole(role: string): role is InvitableRole {
  return (INVITABLE_ROLES as readonly string[]).includes(role);
}

export interface InvitationLike {
  email: string;
  status: "pending" | "accepted" | "declined";
}

/**
 * A user may respond only to a *pending* invitation addressed to their own
 * email. This is the authorization gate for accept/decline.
 */
export function canRespond(invitation: InvitationLike, userEmail: string): boolean {
  return (
    invitation.status === "pending" &&
    normalizeEmail(invitation.email) === normalizeEmail(userEmail)
  );
}
