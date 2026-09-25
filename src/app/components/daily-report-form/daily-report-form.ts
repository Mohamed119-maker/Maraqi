import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReportsService } from '../../services/reports.service';
import { NotificationsService } from '../../services/notifications.service';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../interfaces/project';
import { AuthService } from '../../auth/auth.service';
import { DailyReport } from '../../interfaces/daily-report';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-daily-report-form',
  styleUrl: './daily-report-form.css',
  templateUrl: './daily-report-form.html',
})
export class DailyReportForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly reports = inject(ReportsService);
  private readonly notifications = inject(NotificationsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);
  photoNames = signal<string[]>([]);
  reviewing = signal(false);
  editingDraftId = signal<string | null>(null);
  readonly reportsHome = this.auth.getRole() === 'engineer' ? '/engineer/reports' : '/reports';
  projects = signal<Project[]>([]);
  readonly workOptions = ['مباني', 'محارة', 'كهرباء', 'سباكة', 'عزل', 'أعمال خرسانة'];

  reportForm = this.formBuilder.group({
    projectId: ['', Validators.required],
    reportDate: [new Date().toISOString().slice(0, 10), Validators.required],
    siteStatus: ['normal', Validators.required],
    completedWorks: [<string[]>[], Validators.required],
    summary: ['', [Validators.required, Validators.maxLength(2000)]],
    photos: [<string[]>[], [Validators.maxLength(5)]],
  });

  constructor() {
    const user = this.auth.getUser();
    this.projectsService.getAll().subscribe({
      next: (projects) => this.projects.set(projects.filter((project) => project.isActive && (user?.role !== 'engineer' || project.engineerId === user.id))),
    });
    const draftId = this.route.snapshot.queryParamMap.get('draft');
    if (draftId) {
      this.reports.getById(draftId).subscribe({
        next: (report) => {
          if (report.engineerId !== this.auth.getUser()?.id || report.status !== 'draft') return;
          this.editingDraftId.set(report.id);
          this.reportForm.patchValue({ projectId: report.projectId, reportDate: report.reportDate, siteStatus: report.siteStatus, completedWorks: report.completedWorks, summary: report.summary, photos: report.photoUrls });
          this.photoNames.set(report.photoUrls);
        },
      });
    }
  }

  toggleWork(work: string) {
    const selected = this.reportForm.controls.completedWorks.value ?? [];
    this.reportForm.controls.completedWorks.setValue(selected.includes(work) ? selected.filter((item) => item !== work) : [...selected, work]);
    this.reportForm.controls.completedWorks.markAsTouched();
  }

  onPhotosChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const names = Array.from(input.files ?? []).map((file) => file.name);
    this.photoNames.set(names.slice(0, 5));
    this.reportForm.controls.photos.setValue(names);
    this.reportForm.controls.photos.markAsTouched();
  }

  submit() {
    this.saved.set(false);
    this.error.set(null);
    if (this.reportForm.invalid || this.photoNames().length > 5) {
      this.reportForm.markAllAsTouched();
      return;
    }

    if (!this.reviewing()) {
      this.reviewing.set(true);
      return;
    }

    this.persist('submitted');
  }

  saveDraft() {
    this.error.set(null);
    const requiredControls = [this.reportForm.controls.projectId, this.reportForm.controls.reportDate, this.reportForm.controls.siteStatus];
    if (requiredControls.some((control) => control.invalid)) {
      requiredControls.forEach((control) => control.markAsTouched());
      return;
    }
    this.persist('draft');
  }

  cancelReview() {
    this.reviewing.set(false);
  }

  isLate(): boolean {
    const reportDate = this.reportForm.controls.reportDate.value;
    return !!reportDate && reportDate < new Date().toISOString().slice(0, 10);
  }

  private persist(status: 'draft' | 'submitted') {
    this.saving.set(true);
    const value = this.reportForm.getRawValue();
    const reportId = `report-${Date.now()}`;
    const reportStatus: DailyReport['status'] = status === 'submitted' && this.isLate() ? 'late' : status;
    const payload: Partial<DailyReport> = {
      id: reportId,
      projectId: value.projectId ?? '',
      engineerId: this.auth.getUser()?.id ?? '',
      reportDate: value.reportDate ?? '',
      siteStatus: value.siteStatus as 'normal' | 'needs-follow-up' | 'blocked',
      status: reportStatus,
      completedWorks: value.completedWorks ?? [],
      issues: [],
      needs: [],
      photoUrls: value.photos ?? [],
      summary: value.summary ?? '',
      submittedAt: new Date().toISOString(),
      isLate: status === 'submitted' && this.isLate(),
      locked: status === 'submitted',
    };
    const request = this.editingDraftId() ? this.reports.update(this.editingDraftId()!, payload) : this.reports.create(payload);
    request.subscribe({
      next: () => { const savedReportId = this.editingDraftId() ?? reportId; if (status === 'submitted') this.notifications.addReportSubmitted(savedReportId, value.projectId ?? ''); if (value.siteStatus === 'blocked') this.notifications.addBlockedSite(savedReportId, value.projectId ?? ''); this.saving.set(false); this.saved.set(true); this.reviewing.set(false); this.editingDraftId.set(null); this.reportForm.reset({ reportDate: new Date().toISOString().slice(0, 10), siteStatus: 'normal', photos: [] }); this.photoNames.set([]); },
      error: (error: Error) => { this.saving.set(false); this.error.set(error.message || 'تعذر حفظ التقرير'); },
    });
  }
}