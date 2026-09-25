import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AnalyticsSummary } from '../interfaces/analytics-summary';
import { DailyReport } from '../interfaces/daily-report';
import { Engineer } from '../interfaces/engineer';
import { Issue } from '../interfaces/issue';
import { Need } from '../interfaces/need';
import { Project } from '../interfaces/project';
import { CrudDataSource, MaraqiDataProvider } from './data-provider';
import { mockAnalytics, mockEngineers, mockIssues, mockNeeds, mockProjects, mockReports } from './mock-data';

class MockCollection<T extends { id: string }> implements CrudDataSource<T> {
  private failNextRequest = false;

  constructor(protected records: T[], private readonly latency = 300, private readonly storageKey?: string) {
    this.records = this.readRecords(records);
  }

  getAll(): Observable<T[]> {
    return this.respond([...this.records]);
  }

  getById(id: string): Observable<T> {
    const record = this.records.find((item) => item.id === id);
    return record ? this.respond({ ...record }) : this.respondError(`العنصر ${id} غير موجود`);
  }

  create(payload: Partial<T>): Observable<T> {
    const record = { ...payload, id: payload.id ?? crypto.randomUUID() } as T;
    this.records = [...this.records, record];
    this.persistRecords();
    return this.respond({ ...record });
  }

  update(id: string, payload: Partial<T>): Observable<T> {
    const index = this.records.findIndex((item) => item.id === id);
    if (index < 0) return this.respondError(`العنصر ${id} غير موجود`);
    const record = { ...this.records[index], ...payload, id } as T;
    this.records = this.records.map((item, itemIndex) => itemIndex === index ? record : item);
    this.persistRecords();
    return this.respond({ ...record });
  }

  delete(id: string): Observable<void> {
    this.records = this.records.filter((item) => item.id !== id);
    this.persistRecords();
    return this.respond(void 0);
  }

  failOnce() {
    this.failNextRequest = true;
  }

  private respond<R>(value: R): Observable<R> {
    if (this.failNextRequest) {
      this.failNextRequest = false;
      return this.respondError('تعذر تحميل البيانات التجريبية');
    }
    return of(value).pipe(delay(this.latency));
  }

  protected respondError<R>(message: string): Observable<R> {
    this.failNextRequest = false;
    return throwError(() => new Error(message)).pipe(delay(this.latency));
  }

  private readRecords(fallback: T[]): T[] {
    if (!this.storageKey || typeof localStorage === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) as T[] : fallback;
    } catch {
      return fallback;
    }
  }

  private persistRecords(): void {
    if (!this.storageKey || typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.records));
  }
}

class MockReportCollection extends MockCollection<DailyReport> {
  override create(payload: Partial<DailyReport>): Observable<DailyReport> {
    const duplicate = this.records.some((report) => report.projectId === payload.projectId && report.reportDate === payload.reportDate && report.status !== 'draft');
    return duplicate ? this.respondError('يوجد تقرير مرسل لهذا المشروع في نفس التاريخ') : super.create(payload);
  }
}

@Injectable({ providedIn: 'root' })
export class MockDataProvider implements MaraqiDataProvider {
  projects = new MockCollection<Project>([...mockProjects], 300, 'maraqi-projects');
  reports = new MockReportCollection([...mockReports], 300, 'maraqi-reports');
  issues = new MockCollection<Issue>([...mockIssues], 300, 'maraqi-issues');
  needs = new MockCollection<Need>([...mockNeeds], 300, 'maraqi-needs');
  engineers = new MockCollection<Engineer>([...mockEngineers], 300, 'maraqi-engineers');

  analytics = {
    getSummary: () => of({ ...mockAnalytics, weeklyCompliance: [...mockAnalytics.weeklyCompliance] }).pipe(delay(300)),
  };
}