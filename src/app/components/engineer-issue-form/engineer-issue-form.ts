import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { IssuesService } from '../../services/issues.service';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../interfaces/project';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-engineer-issue-form',
  styleUrl: './engineer-issue-form.css',
  templateUrl: './engineer-issue-form.html',
})
export class EngineerIssueForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly issues = inject(IssuesService);
  private readonly projectsService = inject(ProjectsService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationsService);

  projects = signal<Project[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);
  form = this.formBuilder.group({
    projectId: ['', Validators.required],
    type: ['', Validators.required],
    priority: ['medium', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    impact: ['', Validators.required],
    resolutionNeed: ['', Validators.required],
  });

  ngOnInit() {
    const engineerId = this.auth.getUser()?.id;
    this.projectsService.getAll().subscribe((projects) => this.projects.set(projects.filter((project) => project.engineerId === engineerId && project.isActive)));
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    this.issues.create({
      id: `issue-${Date.now()}`,
      projectId: value.projectId ?? '',
      reportId: '',
      type: value.type ?? '',
      description: value.description ?? '',
      impact: value.impact ?? '',
      resolutionNeed: value.resolutionNeed ?? '',
      status: 'open',
      priority: value.priority as 'high' | 'medium',
      createdAt: new Date().toISOString(),
    }).subscribe({
      next: (issue) => { this.notifications.addIssueCreated(issue.id, issue.projectId); this.saving.set(false); this.router.navigateByUrl('/engineer'); },
      error: () => { this.saving.set(false); this.error.set('تعذر تسجيل المشكلة'); },
    });
  }
}
