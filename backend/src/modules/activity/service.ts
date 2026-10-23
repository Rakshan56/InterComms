import { prisma } from "../../lib/prisma.js";

export const recordActivity = (data: { actorId: string; projectId?: string; taskId?: string; action: string; metadata?: object }) =>
  prisma.activity.create({ data: { ...data, metadata: data.metadata ?? undefined } });
