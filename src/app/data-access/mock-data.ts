import { AnalyticsSummary } from '../interfaces/analytics-summary';
import { DailyReport } from '../interfaces/daily-report';
import { Engineer } from '../interfaces/engineer';
import { Issue } from '../interfaces/issue';
import { Need } from '../interfaces/need';
import { Project } from '../interfaces/project';

export const mockProjects: Project[] = [
  { id: 'project-1', name: 'مشروع الواحة السكني', location: 'الرياض', phase: 'المرحلة الثانية', engineerId: 'engineer-1', status: 'normal', isActive: true },
  { id: 'project-2', name: 'برج النخبة', location: 'جدة', phase: 'الأعمال الإنشائية', engineerId: 'engineer-2', status: 'needs-follow-up', isActive: true },
  { id: 'project-3', name: 'مستودعات الشمال', location: 'الدمام', phase: 'الهيكل الخارجي', engineerId: 'engineer-3', status: 'blocked', isActive: true },
];

export const mockEngineers: Engineer[] = [
  { id: 'engineer-1', name: 'محمد العتيبي', phone: '0500000001', assignedProjectIds: ['project-1'], isActive: true },
  { id: 'engineer-2', name: 'سلمان الحربي', phone: '0500000002', assignedProjectIds: ['project-2'], isActive: true },
  { id: 'engineer-3', name: 'خالد الزهراني', phone: '0500000003', assignedProjectIds: ['project-3'], isActive: true },
];

export const mockReports: DailyReport[] = [
  { id: 'report-1', projectId: 'project-1', engineerId: 'engineer-1', reportDate: '2026-09-25', submittedAt: '2026-09-25T08:30:00Z', isLate: false, locked: true, siteStatus: 'normal', status: 'submitted', completedWorks: ['صب الأعمدة', 'تمديد الكهرباء'], issues: [], needs: [], photoUrls: [], summary: 'الأعمال تسير حسب الخطة.' },
  { id: 'report-2', projectId: 'project-2', engineerId: 'engineer-2', reportDate: '2026-09-25', submittedAt: '2026-09-25T09:15:00Z', isLate: false, locked: true, siteStatus: 'needs-follow-up', status: 'submitted', completedWorks: ['أعمال العزل'], issues: ['تأخر التوريد'], needs: ['مواد عزل'], photoUrls: [], summary: 'يحتاج التوريد إلى متابعة.' },
];

export const mockIssues: Issue[] = [
  { id: 'issue-1', projectId: 'project-3', reportId: 'report-3', type: 'توريد', description: 'تأخر وصول المواد الأساسية', impact: 'توقف جزء من الأعمال', resolutionNeed: 'تأكيد موعد التوريد', status: 'open', priority: 'high', createdAt: '2026-09-22' },
];

export const mockNeeds: Need[] = [
  { id: 'need-1', projectId: 'project-2', itemName: 'مواد عزل', quantity: 20, priority: 'high', status: 'pending', createdAt: '2026-09-25' },
];

export const mockAnalytics: AnalyticsSummary = {
  totalProjects: 20,
  activeProjects: 12,
  totalReports: 32,
  submittedReports: 28,
  lateReports: 4,
  complianceRate: 87,
  weeklyCompliance: [
    { label: 'السبت', value: 62 }, { label: 'الأحد', value: 78 }, { label: 'الإثنين', value: 70 },
    { label: 'الثلاثاء', value: 90 }, { label: 'الأربعاء', value: 76 }, { label: 'الخميس', value: 96 }, { label: 'اليوم', value: 87 },
  ],
};