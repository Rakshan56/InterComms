import { ProjectRole, Role } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "../../lib/prisma.js";

export async function canAccessProject(req: Request, projectId: string, write = false) {
  if (req.user?.role === Role.ADMIN) return true;
  const membership = await prisma.membership.findUnique({ where: { projectId_userId: { projectId, userId: req.user!.id } } });
  if (!membership) return false;
  return !write || (req.user!.role === Role.PROJECT_MANAGER && membership.role === ProjectRole.MANAGER);
}

export function projectVisibility(req: Request) {
  if (req.user!.role === Role.ADMIN) return {};
  return req.user!.role === Role.PROJECT_MANAGER ? { managerId: req.user!.id } : { memberships: { some: { userId: req.user!.id } } };
}
