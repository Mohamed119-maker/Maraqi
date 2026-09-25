import { Observable } from 'rxjs';
import { AnalyticsSummary } from '../interfaces/analytics-summary';
import { DailyReport } from '../interfaces/daily-report';
import { Engineer } from '../interfaces/engineer';
import { Issue } from '../interfaces/issue';
import { Need } from '../interfaces/need';
import { Project } from '../interfaces/project';

export interface CrudDataSource<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  getAll(): Observable<T[]>;
  getById(id: string): Observable<T>;
  create(payload: TCreate): Observable<T>;
  update(id: string, payload: TUpdate): Observable<T>;
  delete(id: string): Observable<void>;
}

export interface MaraqiDataProvider {
  projects: CrudDataSource<Project>;
  reports: CrudDataSource<DailyReport>;
  issues: CrudDataSource<Issue>;
  needs: CrudDataSource<Need>;
  engineers: CrudDataSource<Engineer>;
  analytics: { getSummary(): Observable<AnalyticsSummary> };
}