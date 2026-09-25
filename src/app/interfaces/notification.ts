import { UserRole } from './auth-user';

export interface MaraqiNotification {
  id: string;
  type: 'blocked-site' | 'report-submitted' | 'issue-created' | 'issue-resolved' | 'need-created' | 'system';
  title: string;
  message: string;
  relatedReportId?: string;
  relatedIssueId?: string;
  relatedNeedId?: string;
  recipientUserId?: string;
  recipientRole?: UserRole;
  isRead: boolean;
  createdAt: string;
}