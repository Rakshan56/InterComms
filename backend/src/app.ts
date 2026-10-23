import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import argon2 from "argon2";
import { Role, ProjectRole, TaskStatus, TaskPriority } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";
import { requireAuth as auth, requireRole, safeUser } from "./middleware/auth.js";
import { canAccessProject as projectAccess } from "./modules/projects/access.js";
import { recordActivity as activity } from "./modules/activity/service.js";
const app = express();
app.use(helmet());
app.use(cors({ origin: env.webOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const fail = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });
const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;
app.get("/api/v1/health", async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ data: { status: "ok" } }); } catch { fail(res, 503, "DATABASE_UNAVAILABLE", "The service is not ready."); }
});

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true });
app.post("/api/v1/auth/login", loginLimiter, async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Enter a valid email and password.");
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.active || !(await argon2.verify(user.passwordHash, parsed.data.password))) return fail(res, 401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
  await prisma.session.deleteMany({ where: { userId: user.id } });
  const id = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({ data: { id, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
  res.cookie(env.sessionCookie, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: env.sessionDays * 86400000 });
  res.json({ data: safeUser(user) });
});
app.post("/api/v1/auth/logout", async (req, res) => { const id = req.cookies[env.sessionCookie]; if (id) await prisma.session.deleteMany({ where: { id } }); res.clearCookie(env.sessionCookie); res.status(204).end(); });
app.get("/api/v1/auth/me", auth, (req, res) => res.json({ data: req.user }));

app.get("/api/v1/dashboard/summary", auth, async (req, res) => {
  const where = req.user!.role === Role.ADMIN ? {} : req.user!.role === Role.PROJECT_MANAGER ? { managerId: req.user!.id } : { memberships: { some: { userId: req.user!.id } } };
  const projects = await prisma.project.findMany({ where, include: { tasks: true }, orderBy: { updatedAt: "desc" } });
  const tasks = projects.flatMap((p) => p.tasks);
  res.json({ data: { projects: projects.length, activeProjects: projects.filter(p => p.status === "ACTIVE").length, completedTasks: tasks.filter(t => t.status === "DONE").length, totalTasks: tasks.length, overdue: tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== "DONE").length, recentProjects: projects.slice(0, 5).map(p => ({ id: p.id, name: p.name, status: p.status, completion: p.tasks.length ? Math.round(p.tasks.filter(t => t.status === "DONE").length / p.tasks.length * 100) : 0 })) } });
});

app.get("/api/v1/projects", auth, async (req, res) => {
  const search = String(req.query.search ?? "");
  const status = String(req.query.status ?? "");
  const where: any = { ...(search ? { name: { contains: search, mode: "insensitive" } } : {}), ...(status ? { status } : {}) };
  if (req.user!.role !== Role.ADMIN) where[req.user!.role === Role.PROJECT_MANAGER ? "managerId" : "memberships"] = req.user!.role === Role.PROJECT_MANAGER ? req.user!.id : { some: { userId: req.user!.id } };
  const projects = await prisma.project.findMany({ where, include: { manager: { select: { name: true } }, tasks: { select: { status: true } } }, orderBy: { updatedAt: "desc" } });
  res.json({ data: projects.map(p => ({ ...p, completion: p.tasks.length ? Math.round(p.tasks.filter(t => t.status === "DONE").length / p.tasks.length * 100) : 0 })) });
});
app.post("/api/v1/projects", auth, requireRole(Role.ADMIN), async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(2).max(120), description: z.string().max(2000).optional(), managerId: z.string().uuid().optional(), dueDate: z.string().datetime().optional() }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Project details are invalid.");
  const p = await prisma.project.create({ data: { ...parsed.data, createdById: req.user!.id, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined } });
  await activity({ actorId: req.user!.id, projectId: p.id, action: "PROJECT_CREATED" });
  res.status(201).json({ data: p });
});
app.get("/api/v1/search", auth, async (req, res) => {
  const query = String(req.query.q ?? "").trim();
  if (query.length < 2) return res.json({ data: { projects: [], tasks: [] } });
  const access = req.user!.role === Role.ADMIN
    ? {}
    : req.user!.role === Role.PROJECT_MANAGER
      ? { managerId: req.user!.id }
      : { memberships: { some: { userId: req.user!.id } } };
  const projects = await prisma.project.findMany({
    where: { ...access, name: { contains: query, mode: "insensitive" } },
    select: { id: true, name: true, status: true },
    take: 6,
    orderBy: { updatedAt: "desc" }
  });
  const tasks = await prisma.task.findMany({
    where: {
      project: access,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } }
      ]
    },
    select: { id: true, title: true, status: true, project: { select: { id: true, name: true } } },
    take: 8,
    orderBy: { updatedAt: "desc" }
  });
  res.json({ data: { projects, tasks } });
});
app.get("/api/v1/calendar", auth, async (req, res) => {
  const access = req.user!.role === Role.ADMIN
    ? {}
    : req.user!.role === Role.PROJECT_MANAGER
      ? { managerId: req.user!.id }
      : { memberships: { some: { userId: req.user!.id } } };
  const tasks = await prisma.task.findMany({
    where: { project: access, dueDate: { not: null } },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } }
    },
    orderBy: { dueDate: "asc" }
  });
  res.json({ data: tasks });
});
app.get("/api/v1/notifications", auth, async (req, res) => {
  const projectAccessFilter = req.user!.role === Role.ADMIN
    ? {}
    : req.user!.role === Role.PROJECT_MANAGER
      ? { managerId: req.user!.id }
      : { memberships: { some: { userId: req.user!.id } } };
  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { actorId: req.user!.id },
        { project: projectAccessFilter },
        { task: { project: projectAccessFilter } }
      ]
    },
    include: {
      actor: { select: { name: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true, projectId: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 30
  });
  res.json({ data: activities.map(item => ({
    id: item.id,
    action: item.action,
    actor: item.actor?.name ?? "System",
    project: item.project,
    task: item.task ? { id: item.task.id, title: item.task.title, projectId: item.task.projectId } : null,
    createdAt: item.createdAt
  })) });
});
app.get("/api/v1/projects/:id", auth, async (req, res) => {
  const id = param(req.params.id);
  if (!(await projectAccess(req, id))) return fail(res, 404, "NOT_FOUND", "Project not found.");
  const project = await prisma.project.findUnique({ where: { id }, include: { manager: { select: { name: true, email: true } }, memberships: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }, tasks: true } });
  if (!project) return fail(res, 404, "NOT_FOUND", "Project not found.");
  res.json({ data: { ...project, completion: project.tasks.length ? Math.round(project.tasks.filter(t => t.status === "DONE").length / project.tasks.length * 100) : 0 } });
});
app.patch("/api/v1/projects/:id", auth, async (req, res) => {
  const id = param(req.params.id);
  if (!(await projectAccess(req, id, true)) && req.user!.role !== Role.ADMIN) return fail(res, 403, "FORBIDDEN", "You cannot edit this project.");
  const parsed = z.object({ name: z.string().trim().min(2).max(120).optional(), description: z.string().max(2000).optional(), status: z.enum(["PLANNING", "ACTIVE", "COMPLETED"]).optional(), dueDate: z.string().datetime().nullable().optional() }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Project details are invalid.");
  const p = await prisma.project.update({ where: { id }, data: { ...parsed.data, dueDate: parsed.data.dueDate === null ? null : parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined } });
  res.json({ data: p });
});
app.patch("/api/v1/projects/:id/archive", auth, requireRole(Role.ADMIN), async (req, res) => { const p = await prisma.project.update({ where: { id: param(req.params.id) }, data: { status: "ARCHIVED" } }); await activity({ actorId: req.user!.id, projectId: p.id, action: "PROJECT_ARCHIVED" }); res.json({ data: p }); });
app.get("/api/v1/projects/:id/team", auth, async (req, res) => { const id = param(req.params.id); if (!(await projectAccess(req, id))) return fail(res, 404, "NOT_FOUND", "Project not found."); const data = await prisma.membership.findMany({ where: { projectId: id }, include: { user: { select: { id: true, name: true, email: true, role: true } } } }); res.json({ data }); });

app.get("/api/v1/projects/:projectId/tasks", auth, async (req, res) => { const projectId = param(req.params.projectId); if (!(await projectAccess(req, projectId))) return fail(res, 404, "NOT_FOUND", "Project not found."); const tasks = await prisma.task.findMany({ where: { projectId }, include: { assignee: { select: { id: true, name: true } } }, orderBy: { updatedAt: "desc" } }); res.json({ data: tasks }); });
app.post("/api/v1/projects/:projectId/tasks", auth, async (req, res) => {
  const projectId = param(req.params.projectId);
  if (!(await projectAccess(req, projectId, true)) && req.user!.role !== Role.ADMIN) return fail(res, 403, "FORBIDDEN", "You cannot create tasks here.");
  const parsed = z.object({ title: z.string().trim().min(2).max(200), description: z.string().max(5000).optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"), dueDate: z.string().datetime().nullable().optional(), assigneeId: z.string().uuid().nullable().optional() }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Task details are invalid.");
  const t = await prisma.task.create({ data: { ...parsed.data, projectId, createdById: req.user!.id, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined } });
  await activity({ actorId: req.user!.id, projectId: t.projectId, taskId: t.id, action: "TASK_CREATED" }); res.status(201).json({ data: t });
});
app.get("/api/v1/tasks/:id", auth, async (req, res) => { const t = await prisma.task.findUnique({ where: { id: param(req.params.id) }, include: { project: true, assignee: { select: { id: true, name: true } }, createdBy: { select: { name: true } }, comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } } }); if (!t || !(await projectAccess(req, t.projectId))) return fail(res, 404, "NOT_FOUND", "Task not found."); res.json({ data: t }); });
app.patch("/api/v1/tasks/:id", auth, async (req, res) => {
  const parsed = z.object({ version: z.number().int().positive(), title: z.string().trim().min(2).max(200).optional(), description: z.string().max(5000).nullable().optional(), status: z.nativeEnum(TaskStatus).optional(), priority: z.nativeEnum(TaskPriority).optional(), assigneeId: z.string().uuid().nullable().optional(), dueDate: z.string().datetime().nullable().optional() }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Task details are invalid.");
  const current = await prisma.task.findUnique({ where: { id: String(req.params.id) } }); if (!current || !(await projectAccess(req, current.projectId, true)) && req.user!.role !== Role.ADMIN && !(current.assigneeId === req.user!.id && req.user!.role === Role.TEAM_MEMBER)) return fail(res, 403, "FORBIDDEN", "You cannot edit this task.");
  const { version, ...changes } = parsed.data;
  const result = await prisma.task.updateMany({ where: { id: String(req.params.id), version }, data: { ...changes, version: { increment: 1 }, dueDate: changes.dueDate === null ? null : changes.dueDate ? new Date(changes.dueDate) : undefined } });
  if (!result.count) return fail(res, 409, "STALE_TASK", "This task changed since you opened it. Refresh and review your edits.");
  const task = await prisma.task.findUnique({ where: { id: param(req.params.id) } }); await activity({ actorId: req.user!.id, taskId: task!.id, projectId: task!.projectId, action: "TASK_UPDATED" }); res.json({ data: task });
});
app.post("/api/v1/tasks/:id/comments", auth, async (req, res) => { const parsed = z.object({ content: z.string().trim().min(1).max(2000) }).safeParse(req.body); if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Comment cannot be empty."); const task = await prisma.task.findUnique({ where: { id: param(req.params.id) } }); if (!task || !(await projectAccess(req, task.projectId))) return fail(res, 404, "NOT_FOUND", "Task not found."); const c = await prisma.comment.create({ data: { ...parsed.data, taskId: task.id, authorId: req.user!.id } }); await activity({ actorId: req.user!.id, taskId: task.id, projectId: task.projectId, action: "COMMENT_CREATED" }); res.status(201).json({ data: c }); });
app.get("/api/v1/users", auth, requireRole(Role.ADMIN), async (_req, res) => res.json({ data: await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }, orderBy: { name: "asc" } }) }));
app.patch("/api/v1/users/me", auth, async (req, res) => { const parsed = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email() }).safeParse(req.body); if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Profile details are invalid."); const u = await prisma.user.update({ where: { id: req.user!.id }, data: parsed.data }); res.json({ data: safeUser(u) }); });

app.use((_req, res) => fail(res, 404, "NOT_FOUND", "The requested resource was not found."));
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => { console.error(err); fail(res, 500, "INTERNAL_ERROR", "An unexpected error occurred."); });
export default app;
