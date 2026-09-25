export interface AnalyticsSummary {
  totalProjects: number;
  activeProjects: number;
  totalReports: number;
  submittedReports: number;
  lateReports: number;
  complianceRate: number;
  weeklyCompliance: { label: string; value: number }[];
}