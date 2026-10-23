import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { errorResponse } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; name: string; email: string };
    }
  }
}

export const safeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
});

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.cookies[env.sessionCookie];
  if (!id)
    return errorResponse(
      res,
      401,
      "UNAUTHENTICATED",
      "Authentication is required.",
    );
  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active)
    return errorResponse(
      res,
      401,
      "UNAUTHENTICATED",
      "Authentication is required.",
    );
  req.user = safeUser(session.user);
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : errorResponse(
          res,
          403,
          "FORBIDDEN",
          "You do not have permission for this action.",
        );
