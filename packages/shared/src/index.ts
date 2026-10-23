export const roles = ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"] as const;
export type Role = (typeof roles)[number];
export const taskStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof taskPriorities)[number];
export const projectStatuses = ["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];
