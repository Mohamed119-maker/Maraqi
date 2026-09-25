export type SiteStatus = 'normal' | 'needs-follow-up' | 'blocked';
export type ReportStatus = 'draft' | 'submitted' | 'late';

export interface DailyReport {
  id: string;
  projectId: string;
  engineerId: string;
  reportDate: string;
  submittedAt?: string;
  isLate: boolean;
  locked: boolean;
  siteStatus: SiteStatus;
  status: ReportStatus;
  completedWorks: string[];
  issues: string[];
  needs: string[];
  photoUrls: string[];
  summary: string;
}