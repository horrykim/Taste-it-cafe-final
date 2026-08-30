import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRuntimeBranchToUser,
  canSelectOwnerBranch,
  getActiveFlag,
  normalizeBranch,
  normalizeProfile,
  normalizeRole,
  resolveCurrentBranch,
  resolveStoredBranch,
} from "./authBranchPolicy.js";

test("normalizeRole maps supported role variants", () => {
  assert.equal(normalizeRole("owner"), "OWNER");
  assert.equal(normalizeRole("Owner / Manager"), "OWNER");
  assert.equal(normalizeRole("staff"), "STAFF");
  assert.equal(normalizeRole("cashier"), null);
});

test("getActiveFlag supports boolean and status-based records", () => {
  assert.equal(getActiveFlag({ is_active: true }), true);
  assert.equal(getActiveFlag({ active: false }), false);
  assert.equal(getActiveFlag({ status: "ACTIVE" }), true);
  assert.equal(getActiveFlag({ status: "inactive" }), false);
});

test("normalizeProfile keeps app-facing fields stable", () => {
  const profile = normalizeProfile(
    {
      id: "user-1",
      full_name: "Alex Rivera",
      role: "Owner",
      is_active: true,
      branch_id: "db-branch-1",
      phone: "123",
    },
    { id: "user-1", email: "owner@tasteit.com" }
  );

  assert.deepEqual(
    {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      status: profile.status,
      branchDatabaseId: profile.branchDatabaseId,
      branchId: profile.branchId,
      phone: profile.phone,
    },
    {
      id: "user-1",
      email: "owner@tasteit.com",
      name: "Alex Rivera",
      role: "OWNER",
      status: "ACTIVE",
      branchDatabaseId: "db-branch-1",
      branchId: "db-branch-1",
      phone: "123",
    }
  );
});

test("normalizeBranch uses actual branch IDs from Supabase records", () => {
  const branch = normalizeBranch({
    id: "uuid-1",
    name: "Babag",
    code: "BA",
    address: "Babag, Cebu",
    is_active: true,
  });

  assert.equal(branch.id, "uuid-1");
  assert.equal(branch.databaseId, "uuid-1");
  assert.equal(branch.status, "ACTIVE");
});

test("stored owner branch selection resolves by database id", () => {
  const branches = [
    { id: "uuid-1", databaseId: "uuid-1", isActive: true },
    { id: "uuid-2", databaseId: "uuid-2", isActive: true },
  ];

  assert.equal(resolveStoredBranch(branches, "uuid-1")?.id, "uuid-1");
  assert.equal(resolveStoredBranch(branches, "uuid-2")?.databaseId, "uuid-2");
});

test("resolveCurrentBranch respects staff assignment and owner selection, rejecting stale IDs", () => {
  const branches = [
    { id: "uuid-1", databaseId: "uuid-1", isActive: true },
    { id: "uuid-2", databaseId: "uuid-2", isActive: false },
  ];

  assert.equal(
    resolveCurrentBranch({ role: "STAFF", branchDatabaseId: "uuid-1" }, branches, null)?.id,
    "uuid-1"
  );
  assert.equal(
    resolveCurrentBranch({ role: "OWNER" }, branches, "uuid-2"),
    null // Rejected because isActive is false
  );
  assert.equal(
    resolveCurrentBranch({ role: "OWNER" }, branches, "uuid-1")?.id,
    "uuid-1"
  );
});

test("canSelectOwnerBranch and applyRuntimeBranchToUser enforce branch policy", () => {
  assert.equal(canSelectOwnerBranch({ role: "OWNER" }, { isActive: true }), true);
  assert.equal(canSelectOwnerBranch({ role: "STAFF" }, { isActive: true }), false);

  assert.deepEqual(
    applyRuntimeBranchToUser(
      { id: "staff-1", role: "STAFF", branchId: "uuid-1", branchDatabaseId: "uuid-1" },
      { id: "uuid-3" } // The runtime branch ID is applied as current
    ),
    { id: "staff-1", role: "STAFF", branchId: "uuid-3", branchDatabaseId: "uuid-1" }
  );
});
