import { getStaffLoginRecord } from "./mockStaffService";

const OWNER = {
  id: "owner-1", name: "Alex Rivera", email: "owner@tasteit.com", password: "tasteit123", role: "OWNER", status: "ACTIVE", branchId: null,
};

export async function loginWithMockCredentials({ email, password }) {
  const user = OWNER.email.toLowerCase() === email.trim().toLowerCase() && OWNER.password === password ? OWNER : getStaffLoginRecord(email, password);

  if (!user) {
    throw new Error("The email or password is incorrect.");
  }

  if (user.role === "STAFF" && user.status !== "ACTIVE") {
    throw new Error("This Staff account is inactive.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    branchId: user.branchId,
  };
}
