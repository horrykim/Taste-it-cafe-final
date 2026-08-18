const USERS = [
  {
    id: "owner-1",
    name: "Alex Rivera",
    email: "owner@tasteit.com",
    password: "tasteit123",
    role: "OWNER",
    status: "ACTIVE",
    branchId: null,
  },
  {
    id: "staff-1",
    name: "Mia Santos",
    email: "staff@tasteit.com",
    password: "tasteit123",
    role: "STAFF",
    status: "ACTIVE",
    branchId: "marigondon",
  },
  {
    id: "staff-2",
    name: "Noel Garcia",
    email: "staff.babag@tasteit.com",
    password: "tasteit123",
    role: "STAFF",
    status: "ACTIVE",
    branchId: "babag",
  },
];

export async function loginWithMockCredentials({ email, password }) {
  const user = USERS.find(
    (candidate) =>
      candidate.email.toLowerCase() === email.trim().toLowerCase() &&
      candidate.password === password
  );

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
