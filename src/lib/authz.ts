// Pure authorization logic for trip membership. No DB access lives here, so it
// can be unit-tested in isolation; the data-access layer (lib/trips.ts) loads
// the member list and calls these guards before performing any mutation.

export type Role = "owner" | "editor" | "viewer";

const RANK: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

/** True when `role` is at least as privileged as `min`. */
export function hasAtLeastRole(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

export interface MemberLike {
  userId: string;
  role: Role;
}

export function countOwners(members: MemberLike[]): number {
  return members.filter((m) => m.role === "owner").length;
}

/** Returns an error message if the role change is disallowed, else null. */
export function checkRoleChange(
  members: MemberLike[],
  targetUserId: string,
  newRole: Role,
): string | null {
  const target = members.find((m) => m.userId === targetUserId);
  if (!target) return "That person is not a member of this trip.";
  if (
    target.role === "owner" &&
    newRole !== "owner" &&
    countOwners(members) === 1
  ) {
    return "Cannot demote the last owner of a trip.";
  }
  return null;
}

/** Returns an error message if removing the member is disallowed, else null. */
export function checkRemoveMember(
  members: MemberLike[],
  targetUserId: string,
): string | null {
  const target = members.find((m) => m.userId === targetUserId);
  if (!target) return "That person is not a member of this trip.";
  if (target.role === "owner" && countOwners(members) === 1) {
    return "Cannot remove the last owner of a trip.";
  }
  return null;
}
