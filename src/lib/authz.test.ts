import { describe, it, expect } from "vitest";
import {
  hasAtLeastRole,
  countOwners,
  checkRoleChange,
  checkRemoveMember,
  type MemberLike,
} from "./authz";

const twoOwners: MemberLike[] = [
  { userId: "a", role: "owner" },
  { userId: "b", role: "owner" },
];
const oneOwner: MemberLike[] = [
  { userId: "a", role: "owner" },
  { userId: "b", role: "editor" },
];

describe("hasAtLeastRole", () => {
  it("orders owner > editor > viewer", () => {
    expect(hasAtLeastRole("owner", "editor")).toBe(true);
    expect(hasAtLeastRole("editor", "editor")).toBe(true);
    expect(hasAtLeastRole("viewer", "editor")).toBe(false);
    expect(hasAtLeastRole("editor", "owner")).toBe(false);
  });
});

describe("countOwners", () => {
  it("counts owners", () => {
    expect(countOwners(twoOwners)).toBe(2);
    expect(countOwners(oneOwner)).toBe(1);
  });
});

describe("checkRoleChange", () => {
  it("blocks demoting the last owner", () => {
    expect(checkRoleChange(oneOwner, "a", "editor")).toMatch(/last owner/);
  });
  it("allows demoting an owner when another owner remains", () => {
    expect(checkRoleChange(twoOwners, "a", "editor")).toBeNull();
  });
  it("allows promoting a non-owner", () => {
    expect(checkRoleChange(oneOwner, "b", "owner")).toBeNull();
  });
  it("rejects unknown members", () => {
    expect(checkRoleChange(oneOwner, "zzz", "owner")).toMatch(/not a member/);
  });
});

describe("checkRemoveMember", () => {
  it("blocks removing the last owner", () => {
    expect(checkRemoveMember(oneOwner, "a")).toMatch(/last owner/);
  });
  it("allows removing an owner when another remains", () => {
    expect(checkRemoveMember(twoOwners, "a")).toBeNull();
  });
  it("allows removing a non-owner", () => {
    expect(checkRemoveMember(oneOwner, "b")).toBeNull();
  });
});
