import { describe, it, expect } from "vitest";
import {
  canRespond,
  isInvitableRole,
  normalizeEmail,
  type InvitationLike,
} from "./invite-rules";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });
});

describe("isInvitableRole", () => {
  it("accepts editor/viewer but not owner", () => {
    expect(isInvitableRole("editor")).toBe(true);
    expect(isInvitableRole("viewer")).toBe(true);
    expect(isInvitableRole("owner")).toBe(false);
    expect(isInvitableRole("nonsense")).toBe(false);
  });
});

describe("canRespond", () => {
  const pending: InvitationLike = { email: "Guest@Example.com", status: "pending" };

  it("allows the addressed user (case-insensitive)", () => {
    expect(canRespond(pending, "guest@example.com")).toBe(true);
  });
  it("rejects a different email", () => {
    expect(canRespond(pending, "someone@else.com")).toBe(false);
  });
  it("rejects non-pending invitations", () => {
    expect(canRespond({ email: "guest@example.com", status: "accepted" }, "guest@example.com")).toBe(false);
  });
});
