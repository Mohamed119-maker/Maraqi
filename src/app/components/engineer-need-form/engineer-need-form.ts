import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NeedsService } from '../../services/needs.service';
import { NotificationsService } from '../../services/notifications.service';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../interfaces/project';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-engineer-need-form',
  styleUrl: './engineer-need-form.css',
  templateUrl: './engineer-need-form.html',
})
export class EngineerNeedForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly needs = inject(NeedsService);
  private readonly notifications = inject(NotificationsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly router = inject(Router);

  projects = signal<Project[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);
  form = this.formBuilder.group({
    projectId: ['', Validators.required],
    itemName: ['', [Validators.required, Validators.maxLength(100)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    priority: ['medium', Validators.required],
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
    this.needs.create({
      id: `need-${Date.now()}`,
      projectId: value.projectId ?? '',
      itemName: value.itemName ?? '',
      quantity: Number(value.quantity ?? 1),
      priority: value.priority as 'high' | 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }).subscribe({
      next: (need) => { this.notifications.addNeedCreated(need.id, need.projectId); this.saving.set(false); this.router.navigateByUrl('/engineer'); },
      error: (error: Error) => { this.saving.set(false); this.error.set(error.message || 'تعذر إرسال الاحتياج'); },
    });
  }
}
