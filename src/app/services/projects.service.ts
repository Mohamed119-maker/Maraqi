import { Injectable, inject } from '@angular/core';
import { Project } from '../interfaces/project';
import { MARAQI_DATA_PROVIDER } from '../data-access/data-provider.token';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly provider = inject(MARAQI_DATA_PROVIDER);

  getAll() { return this.provider.projects.getAll(); }
  getById(id: string) { return this.provider.projects.getById(id); }
  create(payload: Partial<Project>) { return this.provider.projects.create(payload); }
  update(id: string, payload: Partial<Project>) { return this.provider.projects.update(id, payload); }
  delete(id: string) { return this.provider.projects.delete(id); }
}