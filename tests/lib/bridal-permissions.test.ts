import { canAccessBridalResource } from "@/lib/bridal/permissions";

describe("canAccessBridalResource", () => {
  it("allows the authenticated owner", () => {
    expect(
      canAccessBridalResource({
        currentUserId: "user-1",
        sessionId: null,
        resource: { userId: "user-1", sessionId: "session-1" },
      })
    ).toBe(true);
  });

  it("allows the matching anonymous session", () => {
    expect(
      canAccessBridalResource({
        currentUserId: null,
        sessionId: "session-1",
        resource: { userId: null, sessionId: "session-1" },
      })
    ).toBe(true);
  });

  it("rejects unrelated users and sessions", () => {
    expect(
      canAccessBridalResource({
        currentUserId: "user-2",
        sessionId: "session-2",
        resource: { userId: "user-1", sessionId: "session-1" },
      })
    ).toBe(false);
  });
});

