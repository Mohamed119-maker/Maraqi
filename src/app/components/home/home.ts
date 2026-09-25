import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { ProjectsService } from '../../services/projects.service';
import { ReportsService } from '../../services/reports.service';
import { AnalyticsSummary } from '../../interfaces/analytics-summary';
import { Project } from '../../interfaces/project';
import { DailyReport } from '../../interfaces/daily-report';
import { AuthService } from '../../auth/auth.service';
import { NotificationsService } from '../../services/notifications.service';
import { EngineersService } from '../../services/engineers.service';
import { Engineer } from '../../interfaces/engineer';
import { IssuesService } from '../../services/issues.service';
import { Issue } from '../../interfaces/issue';
import { NeedsService } from '../../services/needs.service';
import { Need } from '../../interfaces/need';
import { MaraqiNotification } from '../../interfaces/notification';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly reportsService = inject(ReportsService);
  private readonly engineersService = inject(EngineersService);
  private readonly issuesService = inject(IssuesService);
  private readonly needsService = inject(NeedsService);
  private readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationsService);
  readonly userId = this.auth.getUser()?.id;

  greeting = signal(this.getGreeting());
  userName = signal(this.auth.getUser()?.name ?? 'المستخدم');
  summary = signal<AnalyticsSummary | null>(null);
  projects = signal<Project[]>([]);
  reports = signal<DailyReport[]>([]);
  engineers = signal<Engineer[]>([]);
  issues = signal<Issue[]>([]);
  needs = signal<Need[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  private getGreeting(): string {
    return new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
  }

  ngOnInit() {
    forkJoin({
      summary: this.analytics.getSummary(),
      projects: this.projectsService.getAll(),
      reports: this.reportsService.getAll(),
      engineers: this.engineersService.getAll(),
      issues: this.issuesService.getAll(),
      needs: this.needsService.getAll(),
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.projects.set(data.projects);
        this.reports.set(data.reports);
        this.engineers.set(data.engineers);
        this.issues.set(data.issues);
        this.needs.set(data.needs);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message || 'حدث خطأ أثناء تحميل لوحة الإدارة');
        this.loading.set(false);
      },
    });
  }

  projectName(projectId: string): string {
    return this.projects().find((project) => project.id === projectId)?.name ?? projectId;
  }

  engineerName(engineerId: string): string {
    return this.engineers().find((engineer) => engineer.id === engineerId)?.name ?? engineerId;
  }

  reportEngineerName(report: DailyReport): string {
    const project = this.projects().find((item) => item.id === report.projectId);
    return this.engineerName(project?.engineerId ?? report.engineerId);
  }

  projectStatus(projectId: string): string {
    const status = this.projects().find((project) => project.id === projectId)?.status;
    return status === 'normal' ? 'طبيعي' : status === 'blocked' ? 'معطل' : 'يحتاج متابعة';
  }

  reportHasIssue(report: DailyReport): boolean {
    return this.issues().some((issue) => (issue.reportId === report.id || issue.projectId === report.projectId) && issue.status !== 'resolved');
  }

  reportNeedsAction(report: DailyReport): boolean {
    return this.reportHasIssue(report) || this.projectStatus(report.projectId) === 'معطل';
  }

  siteNotifications() {
    return this.notifications.notificationsFor(this.userId, 'admin').filter((notification) =>
      notification.type !== 'issue-created' ||
      !this.issues().some((issue) => issue.id === notification.relatedIssueId && issue.status === 'resolved'),
    );
  }

  unreadSiteNotificationCount(): number {
    return this.siteNotifications().filter((notification) => !notification.isRead).length;
  }

  notificationMessage(notification: MaraqiNotification): string {
    const projectId = this.notificationProjectId(notification);
    const project = this.projects().find((item) => item.id === projectId);
    const report = this.reports().find((item) => item.id === notification.relatedReportId);
    const engineerId = project?.engineerId ?? report?.engineerId;
    const message = projectId ? notification.message.replace(projectId, this.projectName(projectId)) : notification.message;
    return engineerId ? `${message} · المهندس: ${this.engineerName(engineerId)}` : message;
  }

  notificationNeedsAction(notification: MaraqiNotification): boolean {
    if (notification.type === 'issue-created' || notification.type === 'blocked-site') return true;
    const report = this.reports().find((item) => item.id === notification.relatedReportId);
    return report ? this.reportNeedsAction(report) : false;
  }

  notificationActionRoute(notification: MaraqiNotification): string {
    const issue = this.issues().find((item) => item.id === notification.relatedIssueId);
    const report = this.reports().find((item) => item.id === notification.relatedReportId);
    return notification.type === 'issue-created' || issue?.status !== 'resolved' && !!issue || !!report && this.reportHasIssue(report)
      ? '/issues'
      : '/projects';
  }

  notificationActionLabel(notification: MaraqiNotification): string {
    return this.notificationActionRoute(notification) === '/issues' ? 'مراجعة المشكلة' : 'مراجعة المشروع';
  }

  private notificationProjectId(notification: MaraqiNotification): string | undefined {
    return this.issues().find((item) => item.id === notification.relatedIssueId)?.projectId
      ?? this.reports().find((item) => item.id === notification.relatedReportId)?.projectId
      ?? this.needs().find((item) => item.id === notification.relatedNeedId)?.projectId;
  }

  timeAgo(date?: string): string {
    if (!date) return 'منذ لحظات';
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
    if (seconds < 60) return 'منذ لحظات';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  }
}
