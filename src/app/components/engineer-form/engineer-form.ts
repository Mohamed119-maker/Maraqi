import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EngineersService } from '../../services/engineers.service';
import { AuthService } from '../../auth/auth.service';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../interfaces/project';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-engineer-form',
  styleUrl: './engineer-form.css',
  templateUrl: './engineer-form.html',
})
export class EngineerForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly engineers = inject(EngineersService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly projectsService = inject(ProjectsService);

  saving = signal(false);
  error = signal<string | null>(null);
  photoName = signal('');
  projects = signal<Project[]>([]);
  form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    projectId: ['', Validators.required],
  });

  constructor() {
    this.projectsService.getAll().subscribe((projects) => this.projects.set(projects.filter((project) => project.isActive)));
  }

  onPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.photoName.set(input.files?.[0]?.name ?? '');
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    const engineer = {
      id: `engineer-${Date.now()}`,
      name: value.name ?? '',
      phone: value.phone ?? '',
      password: value.password ?? '',
      photoUrl: this.photoName(),
      assignedProjectIds: value.projectId ? [value.projectId] : [],
      isActive: true,
    };
    this.engineers.create(engineer).subscribe({
      next: (created) => { this.auth.persistEngineer(created); this.router.navigateByUrl('/engineers'); },
      error: (error: Error) => { this.saving.set(false); this.error.set(error.message || 'تعذر إضافة المهندس'); },
    });
  }
}
