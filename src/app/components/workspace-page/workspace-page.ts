import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { EngineersService } from '../../services/engineers.service';
import { IssuesService } from '../../services/issues.service';
import { NeedsService } from '../../services/needs.service';
import { ProjectsService } from '../../services/projects.service';
import { ReportsService } from '../../services/reports.service';
import { WorkspaceSection, WorkspaceRow } from '../../interfaces/workspace-section';
import { Engineer } from '../../interfaces/engineer';
import { Project } from '../../interfaces/project';
import { Issue } from '../../interfaces/issue';
import { Need } from '../../interfaces/need';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  imports: [RouterLink],
  selector: 'app-workspace-page',
  styleUrl: './workspace-page.css',
  templateUrl: './workspace-page.html',
})
export class WorkspacePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projects = inject(ProjectsService);
  private readonly reports = inject(ReportsService);
  private readonly issues = inject(IssuesService);
  private readonly needs = inject(NeedsService);
  private readonly engineers = inject(EngineersService);
  private readonly analytics = inject(AnalyticsService);
  private readonly notifications = inject(NotificationsService);

  section = signal<WorkspaceSection>({ key: '', title: '', subtitle: '', icon: '', action: '', cards: [], rows: [] });
  loading = signal(true);
  error = signal<string | null>(null);
  pendingEngineerDelete = signal<WorkspaceRow | null>(null);
  pendingProjectAssignment = signal<WorkspaceRow | null>(null);
  assignmentEngineerId = signal('');
  availableEngineers = signal<Engineer[]>([]);

  ngOnInit() {
    const config = this.route.snapshot.data['section'] as WorkspaceSection;
    this.section.set({ ...config, cards: [], rows: [] });
    this.load(config.key);
  }

  exportReports(format: 'excel' | 'pdf') {
    if (format === 'pdf') {
      window.print();
      return;
    }

    const rows = this.section().rows.map((row) => [row.title, row.detail, row.owner, row.status].join(','));
    const csv = ['العنصر,التفاصيل,المسؤول,الحالة', ...rows].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.section().key}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  resolveIssue(id: string) {
    this.issues.getById(id).subscribe((issue) => this.projects.getById(issue.projectId).subscribe((project) => {
      this.issues.update(id, { status: 'resolved' }).subscribe(() => {
        if (project.status === 'blocked') this.projects.update(project.id, { status: 'normal' }).subscribe();
        this.notifications.addIssueResolved(issue.id, project.engineerId, project.id);
        this.section.update((section) => ({ ...section, rows: section.rows.map((row) => row.id === id ? { ...row, status: 'متحلة', tone: 'green' } : row) }));
      });
    }));
  }

  approveNeed(id: string) {
    this.needs.update(id, { status: 'provided' }).subscribe(() => this.section.update((section) => ({ ...section, rows: section.rows.map((row) => row.id === id ? { ...row, status: 'تم التوفير', tone: 'green' } : row) })));
  }

  requestDeleteEngineer(row: WorkspaceRow) {
    this.pendingEngineerDelete.set(row);
  }

  confirmDeleteEngineer() {
    const engineer = this.pendingEngineerDelete();
    if (!engineer?.id) return;
    this.engineers.delete(engineer.id).subscribe(() => {
      this.section.update((section) => ({ ...section, rows: section.rows.filter((row) => row.id !== engineer.id) }));
      this.pendingEngineerDelete.set(null);
    });
  }

  cancelDeleteEngineer() {
    this.pendingEngineerDelete.set(null);
  }

  requestProjectAssignment(row: WorkspaceRow) {
    this.pendingProjectAssignment.set(row);
    this.assignmentEngineerId.set(this.availableEngineers().find((engineer) => engineer.name === row.owner)?.id ?? '');
  }

  confirmProjectAssignment() {
    const project = this.pendingProjectAssignment();
    const engineer = this.availableEngineers().find((item) => item.id === this.assignmentEngineerId());
    if (!project?.id || !engineer) return;
    this.projects.update(project.id, { engineerId: engineer.id }).subscribe(() => {
      this.section.update((section) => ({ ...section, rows: section.rows.map((row) => row.id === project.id ? { ...row, owner: engineer.name } : row) }));
      this.pendingProjectAssignment.set(null);
    });
  }

  cancelProjectAssignment() {
    this.pendingProjectAssignment.set(null);
  }

  timeAgo(date?: string): string {
    if (!date) return 'غير محدد';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
    if (elapsedSeconds < 60) return 'منذ لحظات';
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }

  private load(key: string) {
    if (key === 'settings') {
      this.section.update((section) => ({ ...section, cards: [
        { label: 'المستخدمون', value: '28', caption: '24 مهندس و4 إدارة', tone: 'info' },
        { label: 'المشاريع النشطة', value: '12', caption: 'من أصل 20', tone: 'positive' },
        { label: 'إشعارات اليوم', value: '09', caption: '3 لم تتم قراءتها', tone: 'warning' },
        { label: 'حالة النظام', value: 'جيد', caption: 'كل الخدمات تعمل', tone: 'positive' },
      ] }));
      this.loading.set(false);
      return;
    }

    if (key === 'reports') {
      forkJoin({ reports: this.reports.getAll(), projects: this.projects.getAll(), engineers: this.engineers.getAll(), issues: this.issues.getAll() }).subscribe({
        next: (data) => { this.section.update((section) => this.buildReportSection(section, data)); this.loading.set(false); },
        error: (error: Error) => { this.error.set(error.message || 'حدث خطأ أثناء تحميل التقارير'); this.loading.set(false); },
      });
      return;
    }

    if (key === 'projects') {
      forkJoin({ projects: this.projects.getAll(), engineers: this.engineers.getAll() }).subscribe({
        next: (data) => { this.section.update((section) => this.buildProjectsSection(section, data.projects, data.engineers)); this.loading.set(false); },
        error: (error: Error) => { this.error.set(error.message || 'حدث خطأ أثناء تحميل المشاريع'); this.loading.set(false); },
      });
      return;
    }

    if (key === 'issues') {
      forkJoin({ issues: this.issues.getAll(), projects: this.projects.getAll() }).subscribe({
        next: (data) => { this.section.update((section) => ({ ...section, rows: data.issues.map((issue) => this.issueRow(issue, data.projects)) })); this.loading.set(false); },
        error: (error: Error) => { this.error.set(error.message || 'حدث خطأ أثناء تحميل المشاكل'); this.loading.set(false); },
      });
      return;
    }

    if (key === 'needs') {
      forkJoin({ needs: this.needs.getAll(), projects: this.projects.getAll() }).subscribe({
        next: (data) => { this.section.update((section) => ({ ...section, rows: data.needs.map((need) => this.needRow(need, data.projects)) })); this.loading.set(false); },
        error: (error: Error) => { this.error.set(error.message || 'حدث خطأ أثناء تحميل الاحتياجات'); this.loading.set(false); },
      });
      return;
    }

    let request: Observable<unknown>;
    if (key === 'projects') request = this.projects.getAll();
    else if (key === 'reports') request = this.reports.getAll();
    else if (key === 'issues') request = this.issues.getAll();
    else if (key === 'needs') request = this.needs.getAll();
    else if (key === 'engineers') request = this.engineers.getAll();
    else request = this.analytics.getSummary();

    request.subscribe({
      next: (data) => {
        this.section.update((section) => this.buildSection(section, key, data));
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message || 'حدث خطأ أثناء تحميل البيانات');
        this.loading.set(false);
      },
    });
  }

  private buildSection(section: WorkspaceSection, key: string, data: unknown): WorkspaceSection {
    if (key === 'projects') return { ...section, cards: this.projectCards(data as Project[]), rows: (data as Project[]).map((project) => this.projectRow(project)) };
    if (key === 'engineers') return { ...section, cards: this.engineerCards(data as Engineer[]), rows: (data as Engineer[]).map((engineer) => ({ id: engineer.id, title: engineer.name, detail: engineer.phone, owner: `${engineer.assignedProjectIds.length} مشاريع`, status: engineer.isActive ? 'نشط' : 'غير نشط', tone: engineer.isActive ? 'green' : 'blue' })) };
    if (key === 'issues') {
      return { ...section, rows: [...(data as Issue[])].sort((first, second) => first.priority === 'high' ? -1 : second.priority === 'high' ? 1 : 0).map((issue) => ({ id: issue.id, title: issue.type, detail: `${issue.description} - منذ ${this.daysSince(issue.createdAt)} يوم`, owner: issue.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة', status: issue.status === 'open' ? 'مفتوحة' : issue.status === 'resolved' ? 'متحلة' : 'قيد المتابعة', tone: issue.status === 'resolved' ? 'green' : issue.priority === 'high' ? 'red' : 'amber' })) };
    }
    if (key === 'needs') {
      return { ...section, rows: [...(data as Need[])].sort((first, second) => first.priority === 'high' ? -1 : second.priority === 'high' ? 1 : 0).map((need) => ({ id: need.id, title: need.itemName, detail: `${need.quantity} وحدة - ${need.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة'}`, owner: need.projectId, status: need.status === 'provided' ? 'تم التوفير' : 'معلّق', tone: need.status === 'provided' ? 'green' : need.priority === 'high' ? 'red' : 'amber' })) };
    }
    if (key === 'analytics') {
      const summary = data as { complianceRate: number; totalProjects: number; activeProjects: number; totalReports: number; lateReports: number; weeklyCompliance: { label: string; value: number }[] };
      return { ...section, chart: true, cards: [{ label: 'المشاريع', value: `${summary.totalProjects}`, caption: `${summary.activeProjects} نشط`, tone: 'info' }, { label: 'التقارير', value: `${summary.totalReports}`, caption: 'هذا الشهر', tone: 'positive' }, { label: 'متأخرة', value: `${summary.lateReports}`, caption: 'تحتاج متابعة', tone: 'warning' }, { label: 'الالتزام', value: `${summary.complianceRate}%`, caption: 'متوسط الشركة', tone: 'positive' }], rows: summary.weeklyCompliance.map((item) => ({ title: item.label, detail: 'نسبة الالتزام اليومية', owner: 'التقارير', status: `${item.value}%`, tone: item.value >= 80 ? 'green' : 'amber' })) };
    }
    const rows = (data as { id: string; status: string; priority?: string; description?: string; itemName?: string; quantity?: number }[]);
    return { ...section, rows: rows.map((item) => ({ id: item.id, title: item.itemName ?? item.description ?? item.id, detail: item.priority ?? 'تحديث مسجل', owner: 'إدارة الموقع', status: item.status, tone: item.status === 'resolved' || item.status === 'provided' ? 'green' : item.status === 'open' || item.status === 'pending' ? 'red' : 'amber' })) };
  }

  private buildReportSection(section: WorkspaceSection, data: { reports: import('../../interfaces/daily-report').DailyReport[]; projects: Project[]; engineers: Engineer[]; issues: Issue[] }): WorkspaceSection {
    return {
      ...section,
      cards: this.projectCards(data.projects),
      rows: data.reports.map((report) => {
        const project = data.projects.find((item) => item.id === report.projectId);
        const engineer = data.engineers.find((item) => item.id === project?.engineerId);
        const hasIssue = data.issues.some((issue) => (issue.reportId === report.id || issue.projectId === report.projectId) && issue.status !== 'resolved');
        const projectStatus = project?.status ?? 'needs-follow-up';
        return {
          id: report.id,
          title: report.summary || `تقرير يوم ${report.reportDate}`,
          detail: `المشروع: ${project?.name ?? report.projectId}`,
          owner: engineer?.name ?? report.engineerId,
          status: projectStatus === 'normal' ? 'طبيعي' : projectStatus === 'blocked' ? 'معطل' : 'يحتاج متابعة',
          tone: projectStatus === 'normal' ? 'green' : projectStatus === 'blocked' ? 'red' : 'amber',
          actionRoute: hasIssue ? '/issues' : undefined,
          actionLabel: hasIssue ? 'مراجعة المشكلة' : undefined,
          updatedAt: report.submittedAt ?? report.reportDate,
        };
      }),
    };
  }

  private buildProjectsSection(section: WorkspaceSection, projects: Project[], engineers: Engineer[]): WorkspaceSection {
    this.availableEngineers.set(engineers);
    const engineersById = new Map(engineers.map((engineer) => [engineer.id, engineer.name]));
    return { ...section, cards: this.projectCards(projects), rows: projects.map((project) => this.projectRow(project, engineersById.get(project.engineerId) ?? 'غير محدد')) };
  }

  private issueRow(issue: Issue, projects: Project[]): WorkspaceRow {
    const project = projects.find((item) => item.id === issue.projectId);
    return { id: issue.id, title: issue.type, detail: `${project?.name ?? 'مشروع غير معروف'} - ${issue.description}`, owner: issue.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة', status: issue.status === 'open' ? 'مفتوحة' : issue.status === 'resolved' ? 'متحلة' : 'قيد المتابعة', tone: issue.status === 'resolved' ? 'green' : issue.priority === 'high' ? 'red' : 'amber', updatedAt: issue.createdAt };
  }

  private needRow(need: Need, projects: Project[]): WorkspaceRow {
    const project = projects.find((item) => item.id === need.projectId);
    return { id: need.id, title: need.itemName, detail: `${project?.name ?? 'مشروع غير معروف'} - ${need.quantity} وحدة - ${need.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة'}`, owner: project?.name ?? 'مشروع غير معروف', status: need.status === 'provided' ? 'تم التوفير' : 'معلّق', tone: need.status === 'provided' ? 'green' : need.priority === 'high' ? 'red' : 'amber', updatedAt: need.createdAt };
  }

  private projectCards(projects: Project[]) {
    return [
      { label: 'كل المشاريع', value: `${projects.length}`, caption: `${projects.filter((project) => project.isActive).length} مشروع نشط`, tone: 'info' as const },
      { label: 'طبيعي', value: `${projects.filter((project) => project.status === 'normal').length}`, caption: 'تسير حسب الخطة', tone: 'positive' as const },
      { label: 'يحتاج متابعة', value: `${projects.filter((project) => project.status === 'needs-follow-up').length}`, caption: 'أولوية متوسطة', tone: 'warning' as const },
      { label: 'معطل', value: `${projects.filter((project) => project.status === 'blocked').length}`, caption: 'يحتاج تدخلًا عاجلًا', tone: 'danger' as const },
    ];
  }

  private engineerCards(engineers: Engineer[]) {
    return [{ label: 'المهندسون', value: `${engineers.length}`, caption: 'مسجلون بالنظام', tone: 'info' as const }, { label: 'نشطون', value: `${engineers.filter((engineer) => engineer.isActive).length}`, caption: 'متاحون اليوم', tone: 'positive' as const }, { label: 'المشاريع', value: `${engineers.reduce((total, engineer) => total + engineer.assignedProjectIds.length, 0)}`, caption: 'قيد الإشراف', tone: 'positive' as const }, { label: 'المتابعة', value: '05', caption: 'تحتاج متابعة', tone: 'warning' as const }];
  }

  private projectRow(project: Project, engineerName = 'غير محدد'): WorkspaceRow {
    return { id: project.id, title: project.name, detail: `${project.location} - ${project.phase}`, owner: engineerName, status: project.status === 'normal' ? 'طبيعي' : project.status === 'blocked' ? 'معطل' : 'يحتاج متابعة', tone: project.status === 'normal' ? 'green' : project.status === 'blocked' ? 'red' : 'amber', actionRoute: project.status === 'blocked' ? '/issues' : undefined, actionLabel: project.status === 'blocked' ? 'مراجعة المشاكل' : undefined };
  }

  private daysSince(date: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
  }
}