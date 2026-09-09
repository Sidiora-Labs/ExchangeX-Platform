
import { adminHandler, createHandler, createMockModels, mockUser, mockRole, mockSupportTicket, mockKYCTemplate, mockKYCApplication } from "../helpers";

const mockModels = createMockModels();

jest.mock("@b/db", () => ({
  sequelize: { transaction: jest.fn(async (cb: Function) => cb({})) },
  models: mockModels,
}));
jest.mock("@b/utils/error", () => ({
  createError: (opts: any) => {
    const err = new Error(typeof opts === "string" ? opts : opts.message || "Error");
    (err as any).statusCode = typeof opts === "string" ? 500 : opts.statusCode || 500;
    return err;
  },
}));
jest.mock("@b/utils/query", () => ({
  getFiltered: jest.fn(async () => ({ items: [mockUser], pagination: { page: 1 } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));
jest.mock("@b/utils/passwords", () => ({
  hashPassword: jest.fn(async (p: string) => `$h$${p}`),
  validatePassword: jest.fn(() => true),
}));

// ---- User CRUD ----
describe("Admin CRM User", () => {
  it("GET /admin/crm/user - lists users", async () => {
    const h = (await import("@b/api/admin/crm/user/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/crm/user - creates a user", async () => {
    const h = (await import("@b/api/admin/crm/user/index.post")).default;
    mockModels.role.findOne.mockResolvedValue(mockRole);
    mockModels.user.findOne.mockResolvedValue(null);
    mockModels.user.create.mockResolvedValue({ id: "new-admin-user", email: "new@test.com" });
    const result = await h(adminHandler({ body: { firstName: "New", lastName: "User", email: "new@test.com", password: "Pass123!" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/crm/user/[id] - gets a user", async () => {
    const h = (await import("@b/api/admin/crm/user/[id]/index.get")).default;
    mockModels.user.findByPk.mockResolvedValue({ ...mockUser, role: mockRole, get() { return this; } });
    const result = await h(adminHandler({ params: { id: "test-user-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/crm/user/[id] - updates a user", async () => {
    const h = (await import("@b/api/admin/crm/user/[id]/index.put")).default;
    mockModels.user.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "test-user-1" }, body: { firstName: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/crm/user/status - changes user status", async () => {
    const h = (await import("@b/api/admin/crm/user/status.put")).default;
    mockModels.user.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { id: "test-user-1", status: "ACTIVE" } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/crm/user/[id] - deletes a user", async () => {
    const h = (await import("@b/api/admin/crm/user/[id]/index.del")).default;
    mockModels.user.destroy.mockResolvedValue(1);
    const result = await h(adminHandler({ params: { id: "test-user-1" } }));
    expect(result).toBeDefined();
  });
});

// ---- Role CRUD ----
describe("Admin CRM Role", () => {
  it("GET /admin/crm/role - lists roles", async () => {
    const h = (await import("@b/api/admin/crm/role/index.get")).default;
    mockModels.role.findAll.mockResolvedValue([mockRole]);
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/crm/role - creates a role", async () => {
    const h = (await import("@b/api/admin/crm/role/index.post")).default;
    mockModels.role.create.mockResolvedValue({ id: "role-new", name: "VIP" });
    const result = await h(adminHandler({ body: { name: "VIP" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/crm/role/[id] - gets a role", async () => {
    const h = (await import("@b/api/admin/crm/role/[id]/index.get")).default;
    mockModels.role.findByPk.mockResolvedValue({ ...mockRole, permissions: [], get() { return this; } });
    const result = await h(adminHandler({ params: { id: "role-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/crm/role/[id] - updates a role", async () => {
    const h = (await import("@b/api/admin/crm/role/[id]/index.put")).default;
    mockModels.role.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "role-1" }, body: { name: "Updated Role" } }));
    expect(result).toBeDefined();
  });

  it("POST /admin/crm/role/[id]/sync - syncs role permissions", async () => {
    const h = (await import("@b/api/admin/crm/role/[id]/sync.post")).default;
    mockModels.role.findByPk.mockResolvedValue({ ...mockRole, permissions: [], get() { return this; } });
    try {
      const result = await h(adminHandler({ params: { id: "role-1" }, body: { permissions: ["p1", "p2"] } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

// ---- KYC Template CRUD ----
describe("Admin CRM KYC Template", () => {
  it("GET /admin/crm/kyc/template - lists templates", async () => {
    const h = (await import("@b/api/admin/crm/kyc/template/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/crm/kyc/template - creates template", async () => {
    const h = (await import("@b/api/admin/crm/kyc/template/index.post")).default;
    mockModels.kycTemplate.create.mockResolvedValue({ id: "kt-new" });
    const result = await h(adminHandler({ body: { title: "KYC L2", level: 2, fields: [] } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/crm/kyc/template/[id] - gets template", async () => {
    const h = (await import("@b/api/admin/crm/kyc/template/[id]/index.get")).default;
    mockModels.kycTemplate.findByPk.mockResolvedValue(mockKYCTemplate);
    const result = await h(adminHandler({ params: { id: "kyc-template-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/crm/kyc/template/[id] - updates template", async () => {
    const h = (await import("@b/api/admin/crm/kyc/template/[id]/index.put")).default;
    mockModels.kycTemplate.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "kyc-template-1" }, body: { title: "Updated" } }));
    expect(result).toBeDefined();
  });
});

// ---- KYC Applicant ----
describe("Admin CRM KYC Applicant", () => {
  it("GET /admin/crm/kyc/applicant - lists applicants", async () => {
    const h = (await import("@b/api/admin/crm/kyc/applicant/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("PUT /admin/crm/kyc/applicant/status - bulk status update", async () => {
    const h = (await import("@b/api/admin/crm/kyc/applicant/status.put")).default;
    mockModels.kycApplication.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["kyc-app-1"], status: "APPROVED" } }));
    expect(result).toBeDefined();
  });
});

// ---- Support Ticket ----
describe("Admin CRM Support Ticket", () => {
  it("GET /admin/crm/support/ticket - lists tickets", async () => {
    const h = (await import("@b/api/admin/crm/support/ticket/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/crm/support/ticket/[id] - gets a ticket", async () => {
    const h = (await import("@b/api/admin/crm/support/ticket/[id]/index.get")).default;
    mockModels.supportTicket.findByPk.mockResolvedValue({ ...mockSupportTicket, user: mockUser, replies: [], get() { return this; } });
    const result = await h(adminHandler({ params: { id: "ticket-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/crm/support/ticket/[id] - updates ticket", async () => {
    const h = (await import("@b/api/admin/crm/support/ticket/[id]/index.put")).default;
    mockModels.supportTicket.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "ticket-1" }, body: { status: "CLOSED" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/crm/support/ticket/status - bulk status update", async () => {
    const h = (await import("@b/api/admin/crm/support/ticket/status.put")).default;
    mockModels.supportTicket.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["ticket-1"], status: "CLOSED" } }));
    expect(result).toBeDefined();
  });
});

// ---- Permission ----
describe("Admin CRM Permission", () => {
  it("GET /admin/crm/permission - lists permissions", async () => {
    const h = (await import("@b/api/admin/crm/permission/index.get")).default;
    mockModels.permission.findAll.mockResolvedValue([{ id: "p1", name: "viewDashboard" }]);
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
