export type IssueStatus = 'open' | 'in-progress' | 'resolved';
export type IssuePriority = 'high' | 'medium';

export interface Issue {
  id: string;
  projectId: string;
  reportId: string;
  type: string;
  description: string;
  impact: string;
  resolutionNeed: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
}