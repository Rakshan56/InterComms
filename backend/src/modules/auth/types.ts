import type { Role } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
};
