import { beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

vi.mock("server-only", () => ({}));

describe("admin invitation delivery adapter", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY;
    delete process.env.ADMIN_INVITATION_EMAIL_WEBHOOK_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.restoreAllMocks();
  });

  it("stays disabled unless the explicit delivery flag is enabled", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { sendAdminInvitationEmail } = await import("@/lib/admin-invitations/delivery");

    await expect(sendAdminInvitationEmail({
      invitationId: "invitation-1",
      invitedEmail: "ada@example.com",
      organizationSlug: "amorim",
      role: "admin",
      rawToken: "raw-token",
      expiresAt: "2026-06-15T00:00:00.000Z",
    })).resolves.toEqual({ delivered: false, reason: "delivery_disabled" });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails closed when enabled without provider configuration", async () => {
    process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY = "true";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { sendAdminInvitationEmail } = await import("@/lib/admin-invitations/delivery");

    await expect(sendAdminInvitationEmail({
      invitationId: "invitation-1",
      invitedEmail: "ada@example.com",
      organizationSlug: "amorim",
      role: "admin",
      rawToken: "raw-token",
      expiresAt: "2026-06-15T00:00:00.000Z",
    })).resolves.toEqual({ delivered: false, reason: "missing_configuration" });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the invite link only to the configured server-side provider", async () => {
    process.env.ENABLE_ADMIN_INVITATION_EMAIL_DELIVERY = "true";
    process.env.ADMIN_INVITATION_EMAIL_WEBHOOK_URL = "https://mail.example.test/admin-invitation";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.test/";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
    } as Response);
    const { sendAdminInvitationEmail } = await import("@/lib/admin-invitations/delivery");

    await expect(sendAdminInvitationEmail({
      invitationId: "invitation-1",
      invitedEmail: "ada@example.com",
      organizationSlug: "amorim",
      role: "admin",
      rawToken: "raw token",
      expiresAt: "2026-06-15T00:00:00.000Z",
    })).resolves.toEqual({ delivered: true });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://mail.example.test/admin-invitation",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const body = String(fetchSpy.mock.calls[0][1]?.body ?? "");
    expect(body).toContain("https://app.example.test/auth/convite?token=raw%20token");
  });
});
