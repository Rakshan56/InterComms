import type { ProjectSummary } from "../shared/types";

export type DashboardSummary = {
  projects: number;
  activeProjects: number;
  completedTasks: number;
  totalTasks: number;
  overdue: number;
  recentProjects: ProjectSummary[];
};
