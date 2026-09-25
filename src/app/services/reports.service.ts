import { Injectable, inject } from '@angular/core';
import { DailyReport } from '../interfaces/daily-report';
import { MARAQI_DATA_PROVIDER } from '../data-access/data-provider.token';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly provider = inject(MARAQI_DATA_PROVIDER);

  getAll() { return this.provider.reports.getAll(); }
  getById(id: string) { return this.provider.reports.getById(id); }
  create(payload: Partial<DailyReport>) { return this.provider.reports.create(payload); }
  update(id: string, payload: Partial<DailyReport>) { return this.provider.reports.update(id, payload); }
  delete(id: string) { return this.provider.reports.delete(id); }
}