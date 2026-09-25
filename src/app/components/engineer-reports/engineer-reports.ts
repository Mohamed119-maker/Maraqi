import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ProjectsService } from '../../services/projects.service';
import { ReportsService } from '../../services/reports.service';
import { DailyReport } from '../../interfaces/daily-report';
import { Project } from '../../interfaces/project';
import { forkJoin } from 'rxjs';

@Component({
  imports: [RouterLink],
  selector: 'app-engineer-reports',
  styleUrl: './engineer-reports.css',
  templateUrl: './engineer-reports.html',
})
export class EngineerReports implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly reportsService = inject(ReportsService);
  private readonly projectsService = inject(ProjectsService);

  reports = signal<DailyReport[]>([]);
  projects = signal<Project[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  pendingDraftDelete = signal<DailyReport | null>(null);

  ngOnInit() {
    const engineerId = this.auth.getUser()?.id;
    forkJoin({ projects: this.projectsService.getAll(), reports: this.reportsService.getAll() }).subscribe({
      next: (data) => {
        const assignedProjects = data.projects.filter((project) => project.engineerId === engineerId);
        const assignedProjectIds = new Set(assignedProjects.map((project) => project.id));
        this.projects.set(assignedProjects);
        this.reports.set(data.reports.filter((report) => assignedProjectIds.has(report.projectId)));
        this.loading.set(false);
      },
      error: () => { this.error.set('تعذر تحميل التقارير'); this.loading.set(false); },
    });
  }

  projectName(projectId: string): string {
    return this.projects().find((project) => project.id === projectId)?.name ?? 'مشروع غير معروف';
  }

  requestDraftDelete(report: DailyReport) {
    if (report.status === 'draft') this.pendingDraftDelete.set(report);
  }

  cancelDraftDelete() {
    if (!this.deletingId()) this.pendingDraftDelete.set(null);
  }

  confirmDraftDelete() {
    const report = this.pendingDraftDelete();
    if (!report || report.status !== 'draft' || this.deletingId()) return;
    this.deletingId.set(report.id);
    this.reportsService.delete(report.id).subscribe({
      next: () => { this.reports.update((reports) => reports.filter((item) => item.id !== report.id)); this.pendingDraftDelete.set(null); this.deletingId.set(null); },
      error: () => { this.error.set('تعذر حذف المسودة'); this.deletingId.set(null); },
    });
  }

  sendDraft(report: DailyReport) {
    if (report.status !== 'draft') return;
    this.reportsService.update(report.id, { status: 'submitted', submittedAt: new Date().toISOString(), isLate: report.reportDate < new Date().toISOString().slice(0, 10), locked: true }).subscribe({
      next: (updated) => this.reports.update((reports) => reports.map((item) => item.id === updated.id ? updated : item)),
      error: () => this.error.set('تعذر إرسال المسودة'),
    });
  }
}
