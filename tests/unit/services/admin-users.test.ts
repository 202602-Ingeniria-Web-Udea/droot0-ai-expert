import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { makeUser, testIds } from "../../helpers/factories";

const mocks = vi.hoisted(() => {
  const user = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  };

  const transaction = vi.fn(
    async (callback: (transaction: { user: typeof user }) => Promise<unknown>) =>
      callback({ user }),
  );

  return { user, transaction };
});

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: mocks.user,
    $transaction: mocks.transaction,
  },
}));

import { listAdminUsers, updateAdminUserRole } from "@/server/services/admin-users";

describe("admin user service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(
      async (callback: (transaction: { user: typeof mocks.user }) => Promise<unknown>) =>
        callback({ user: mocks.user }),
    );
  });

  it("lists users with mapped timestamps", async () => {
    const user = makeUser();
    const admin = makeUser({
      id: testIds.admin,
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
    });

    mocks.user.count.mockResolvedValue(2);
    mocks.user.findMany.mockResolvedValue([admin, user]);

    const result = await listAdminUsers({ page: 1 });

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    });
    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toMatchObject({
      id: testIds.admin,
      role: "ADMIN",
    });
    expect(result.users[0]?.createdAt).toBe(admin.createdAt.toISOString());
    expect(mocks.user.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 0,
      take: 20,
    });
  });

  it("requests the correct page and reports the page count", async () => {
    mocks.user.count.mockResolvedValue(45);
    mocks.user.findMany.mockResolvedValue([makeUser()]);

    const result = await listAdminUsers({ page: 2, pageSize: 20 });

    expect(mocks.user.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 20,
      take: 20,
    });
    expect(result).toMatchObject({
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("reports an empty page beyond the last page", async () => {
    mocks.user.count.mockResolvedValue(3);
    mocks.user.findMany.mockResolvedValue([]);

    const result = await listAdminUsers({ page: 9, pageSize: 20 });

    expect(mocks.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 160,
        take: 20,
      }),
    );
    expect(result).toMatchObject({
      page: 9,
      total: 3,
      totalPages: 1,
    });
  });

  it("rejects self-role changes", async () => {
    await expect(
      updateAdminUserRole(testIds.admin, testIds.admin, Role.USER),
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the target user does not exist", async () => {
    mocks.user.findUnique.mockResolvedValue(null);

    await expect(
      updateAdminUserRole(testIds.admin, testIds.user, Role.ADMIN),
    ).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("prevents demoting the last administrator", async () => {
    mocks.user.findUnique.mockResolvedValue(
      makeUser({
        id: testIds.admin,
        role: "ADMIN",
      }),
    );
    mocks.user.count.mockResolvedValue(1);

    await expect(updateAdminUserRole(testIds.user, testIds.admin, Role.USER)).rejects.toMatchObject(
      {
        status: 409,
        code: "CONFLICT",
      },
    );
    expect(mocks.user.update).not.toHaveBeenCalled();
  });

  it("promotes a user", async () => {
    const updated = makeUser({ role: "ADMIN" });

    mocks.user.findUnique.mockResolvedValue(makeUser());
    mocks.user.update.mockResolvedValue(updated);

    const result = await updateAdminUserRole(testIds.admin, testIds.user, Role.ADMIN);

    expect(result.role).toBe("ADMIN");
    expect(mocks.user.update).toHaveBeenCalledWith({
      where: { id: testIds.user },
      data: { role: Role.ADMIN },
    });
  });

  it("returns the existing user for an unchanged role", async () => {
    const user = makeUser();

    mocks.user.findUnique.mockResolvedValue(user);

    const result = await updateAdminUserRole(testIds.admin, testIds.user, Role.USER);

    expect(result.role).toBe("USER");
    expect(mocks.user.update).not.toHaveBeenCalled();
  });
});
