import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { IssuesService } from '../../services/issues.service';
import { ProjectsService } from '../../services/projects.service';
import { ReportsService } from '../../services/reports.service';
import { Issue } from '../../interfaces/issue';
import { Project } from '../../interfaces/project';
import { DailyReport } from '../../interfaces/daily-report';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-engineer-home',
  styleUrl: './engineer-home.css',
  templateUrl: './engineer-home.html',
})
export class EngineerHome implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly projectsService = inject(ProjectsService);
  private readonly reportsService = inject(ReportsService);
  private readonly issuesService = inject(IssuesService);
  readonly notifications = inject(NotificationsService);

  readonly userName = this.auth.getUser()?.name ?? 'المهندس';
  readonly userId = this.auth.getUser()?.id;
  projects = signal<Project[]>([]);
  reports = signal<DailyReport[]>([]);
  issues = signal<Issue[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const engineerId = this.auth.getUser()?.id;
    forkJoin({
      projects: this.projectsService.getAll(),
      reports: this.reportsService.getAll(),
      issues: this.issuesService.getAll(),
    }).subscribe({
      next: (data) => {
        this.projects.set(data.projects.filter((project) => project.engineerId === engineerId));
        const assignedProjectIds = new Set(this.projects().map((project) => project.id));
        this.reports.set(data.reports.filter((report) => assignedProjectIds.has(report.projectId)));
        const projectIds = new Set(this.projects().map((project) => project.id));
        this.issues.set(data.issues.filter((issue) => projectIds.has(issue.projectId) && issue.status !== 'resolved'));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل بيانات مشاريعك');
        this.loading.set(false);
      },
    });
  }

  projectStatus(status: Project['status']): string {
    return status === 'normal' ? 'طبيعي' : status === 'blocked' ? 'معطل' : 'يحتاج متابعة';
  }
}
