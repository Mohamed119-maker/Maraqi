import { Injectable, inject } from '@angular/core';
import { Issue } from '../interfaces/issue';
import { MARAQI_DATA_PROVIDER } from '../data-access/data-provider.token';

@Injectable({ providedIn: 'root' })
export class IssuesService {
  private readonly provider = inject(MARAQI_DATA_PROVIDER);

  getAll() { return this.provider.issues.getAll(); }
  getById(id: string) { return this.provider.issues.getById(id); }
  create(payload: Partial<Issue>) { return this.provider.issues.create(payload); }
  update(id: string, payload: Partial<Issue>) { return this.provider.issues.update(id, payload); }
  delete(id: string) { return this.provider.issues.delete(id); }
}