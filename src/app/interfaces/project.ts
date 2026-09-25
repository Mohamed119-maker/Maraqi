export type ProjectStatus = 'normal' | 'needs-follow-up' | 'blocked';

export interface Project {
  id: string;
  name: string;
  location: string;
  phase: string;
  engineerId: string;
  status: ProjectStatus;
  isActive: boolean;
}