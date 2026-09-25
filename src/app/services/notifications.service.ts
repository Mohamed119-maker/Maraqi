import { Injectable, signal } from '@angular/core';
import { MaraqiNotification } from '../interfaces/notification';
import { UserRole } from '../interfaces/auth-user';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly storageKey = 'maraqi-notifications';
  private readonly notificationState = signal<MaraqiNotification[]>(this.readNotifications());
  readonly notifications = this.notificationState.asReadonly();

  addBlockedSite(reportId: string, projectId: string) {
    this.add({ type: 'blocked-site', title: 'موقع معطل', message: `تم تسجيل حالة معطل للمشروع ${projectId}`, relatedReportId: reportId, recipientRole: 'admin' });
  }

  addReportSubmitted(reportId: string, projectId: string) {
    this.add({ type: 'report-submitted', title: 'تقرير جديد', message: `تم إرسال تقرير جديد للمشروع ${projectId}`, relatedReportId: reportId, recipientRole: 'admin' });
  }

  addIssueCreated(issueId: string, projectId: string) {
    this.add({ type: 'issue-created', title: 'مشكلة جديدة', message: `تم تسجيل مشكلة جديدة في المشروع ${projectId}`, relatedIssueId: issueId, recipientRole: 'admin' });
  }

  addIssueResolved(issueId: string, engineerId: string, _projectId: string) {
    this.add({ type: 'issue-resolved', title: 'تم حل المشكلة', message: 'تم اعتماد حل المشكلة من الإدارة', relatedIssueId: issueId, recipientUserId: engineerId, recipientRole: 'engineer' });
  }

  addNeedCreated(needId: string, projectId: string) {
    this.add({ type: 'need-created', title: 'احتياج جديد', message: `تم تسجيل طلب احتياج للمشروع ${projectId}`, relatedNeedId: needId, recipientRole: 'admin' });
  }

  markAllRead(userId?: string, role?: UserRole) {
    this.notificationState.update((items) => {
      const next = items.map((item) => this.isVisibleTo(item, userId, role) ? { ...item, isRead: true } : item);
      this.persist(next);
      return next;
    });
  }

  unreadCount(userId?: string, role?: UserRole) {
    return this.notificationsFor(userId, role).filter((item) => !item.isRead).length;
  }

  notificationsFor(userId?: string, role?: UserRole) {
    return this.notificationState().filter((item) => this.isVisibleTo(item, userId, role));
  }

  private add(details: Pick<MaraqiNotification, 'type' | 'title' | 'message' | 'relatedReportId' | 'relatedIssueId' | 'relatedNeedId' | 'recipientUserId' | 'recipientRole'>) {
    this.notificationState.update((items) => {
      const next = [{ id: `notification-${Date.now()}`, ...details, isRead: false, createdAt: new Date().toISOString() }, ...items];
      this.persist(next);
      return next;
    });
  }

  private readNotifications(): MaraqiNotification[] {
    if (typeof localStorage === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as MaraqiNotification[]; } catch { return []; }
  }

  private persist(items: MaraqiNotification[]): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private isVisibleTo(notification: MaraqiNotification, userId?: string, role?: UserRole): boolean {
    return (!notification.recipientUserId || notification.recipientUserId === userId) && (!notification.recipientRole || notification.recipientRole === role);
  }
}