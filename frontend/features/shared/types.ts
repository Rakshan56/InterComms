export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active?: boolean;
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  completion: number;
};

export type TaskSummary = {
  id: string;
  title: string;
  status: string;
  priority: string;
  version: number;
  projectId?: string;
  project?: { id: string; name: string };
  assignee?: { id: string; name: string };
};
