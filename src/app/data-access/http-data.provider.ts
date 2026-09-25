import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AnalyticsSummary } from '../interfaces/analytics-summary';
import { DailyReport } from '../interfaces/daily-report';
import { Engineer } from '../interfaces/engineer';
import { Issue } from '../interfaces/issue';
import { Need } from '../interfaces/need';
import { Project } from '../interfaces/project';
import { environment } from '../../environments/environment';
import { CrudDataSource, MaraqiDataProvider } from './data-provider';

class HttpCollection<T> implements CrudDataSource<T> {
  constructor(private readonly http: HttpClient, private readonly endpoint: string) {}

  getAll() { return this.http.get<T[]>(this.endpoint); }
  getById(id: string) { return this.http.get<T>(`${this.endpoint}/${id}`); }
  create(payload: Partial<T>) { return this.http.post<T>(this.endpoint, payload); }
  update(id: string, payload: Partial<T>) { return this.http.put<T>(`${this.endpoint}/${id}`, payload); }
  delete(id: string) { return this.http.delete<void>(`${this.endpoint}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class HttpDataProvider implements MaraqiDataProvider {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  projects = new HttpCollection<Project>(this.http, `${this.apiBaseUrl}/projects`);
  reports = new HttpCollection<DailyReport>(this.http, `${this.apiBaseUrl}/reports`);
  issues = new HttpCollection<Issue>(this.http, `${this.apiBaseUrl}/issues`);
  needs = new HttpCollection<Need>(this.http, `${this.apiBaseUrl}/needs`);
  engineers = new HttpCollection<Engineer>(this.http, `${this.apiBaseUrl}/engineers`);
  analytics = { getSummary: () => this.http.get<AnalyticsSummary>(`${this.apiBaseUrl}/analytics/summary`) };
}