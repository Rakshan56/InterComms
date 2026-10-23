import { PrismaClient, Role, ProjectRole, ProjectStatus, TaskPriority, TaskStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
async function main() {
  const passwordHash = await argon2.hash("InterComms123!", { type: argon2.argon2id });
  const admin = await prisma.user.upsert({ where: { email: "admin@intercomms.local" }, update: {}, create: { name: "Avery Admin", email: "admin@intercomms.local", passwordHash, role: Role.ADMIN } });
  const manager = await prisma.user.upsert({ where: { email: "manager@intercomms.local" }, update: {}, create: { name: "Maya Manager", email: "manager@intercomms.local", passwordHash, role: Role.PROJECT_MANAGER } });
  const member = await prisma.user.upsert({ where: { email: "member@intercomms.local" }, update: {}, create: { name: "Jordan Member", email: "member@intercomms.local", passwordHash, role: Role.TEAM_MEMBER } });
  const viewer = await prisma.user.upsert({ where: { email: "viewer@intercomms.local" }, update: {}, create: { name: "Riley Viewer", email: "viewer@intercomms.local", passwordHash, role: Role.VIEWER } });
  const project = await prisma.project.upsert({ where: { id: "00000000-0000-0000-0000-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0000-000000000001", name: "Website Relaunch", description: "A focused launch workspace for the InterComms team.", status: ProjectStatus.ACTIVE, managerId: manager.id } });
  await prisma.membership.upsert({ where: { projectId_userId: { projectId: project.id, userId: manager.id } }, update: { role: ProjectRole.MANAGER }, create: { projectId: project.id, userId: manager.id, role: ProjectRole.MANAGER } });
  await prisma.membership.upsert({ where: { projectId_userId: { projectId: project.id, userId: member.id } }, update: {}, create: { projectId: project.id, userId: member.id, role: ProjectRole.MEMBER } });
  if (!(await prisma.task.count({ where: { projectId: project.id } }))) {
    await prisma.task.createMany({ data: [
      { projectId: project.id, title: "Finalize landing page", description: "Review the responsive marketing layout.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: member.id, createdById: admin.id },
      { projectId: project.id, title: "Prepare launch checklist", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assigneeId: manager.id, createdById: manager.id }
    ]});
  }
  const alpha = await prisma.project.upsert({ where: { id: "00000000-0000-0000-0000-000000000002" }, update: { createdById: admin.id, managerId: manager.id }, create: { id: "00000000-0000-0000-0000-000000000002", name: "Project Alpha", description: "Admin-led product discovery and delivery workspace.", status: ProjectStatus.ACTIVE, managerId: manager.id, createdById: admin.id } });
  const beta = await prisma.project.upsert({ where: { id: "00000000-0000-0000-0000-000000000003" }, update: { createdById: manager.id, managerId: manager.id }, create: { id: "00000000-0000-0000-0000-000000000003", name: "Project Beta", description: "Manager-led campaign planning and execution workspace.", status: ProjectStatus.PLANNING, managerId: manager.id, createdById: manager.id } });
  for (const seededProject of [alpha, beta]) {
    await prisma.membership.upsert({ where: { projectId_userId: { projectId: seededProject.id, userId: manager.id } }, update: { role: ProjectRole.MANAGER }, create: { projectId: seededProject.id, userId: manager.id, role: ProjectRole.MANAGER } });
    await prisma.membership.upsert({ where: { projectId_userId: { projectId: seededProject.id, userId: member.id } }, update: {}, create: { projectId: seededProject.id, userId: member.id, role: ProjectRole.MEMBER } });
    await prisma.membership.upsert({ where: { projectId_userId: { projectId: seededProject.id, userId: viewer.id } }, update: {}, create: { projectId: seededProject.id, userId: viewer.id, role: ProjectRole.VIEWER } });
  }
  if (!(await prisma.task.count({ where: { projectId: alpha.id } }))) {
    await prisma.task.createMany({ data: [
      { projectId: alpha.id, title: "Define Alpha milestones", description: "Break the first release into measurable milestones.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: manager.id, createdById: admin.id },
      { projectId: alpha.id, title: "Prepare research brief", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assigneeId: member.id, createdById: admin.id }
    ] });
  }
  if (!(await prisma.task.count({ where: { projectId: beta.id } }))) {
    await prisma.task.createMany({ data: [
      { projectId: beta.id, title: "Draft Beta launch plan", description: "Create the launch plan and review it with the team.", status: TaskStatus.TODO, priority: TaskPriority.URGENT, assigneeId: manager.id, createdById: manager.id },
      { projectId: beta.id, title: "Collect campaign assets", status: TaskStatus.TODO, priority: TaskPriority.LOW, assigneeId: member.id, createdById: manager.id }
    ] });
  }
}
main().finally(() => prisma.$disconnect());
