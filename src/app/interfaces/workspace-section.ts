export interface WorkspaceCard {
  label: string;
  value: string;
  caption: string;
  tone: 'positive' | 'warning' | 'danger' | 'info';
}

export interface WorkspaceRow {
  id?: string;
  title: string;
  detail: string;
  owner: string;
  status: string;
  tone: 'green' | 'amber' | 'red' | 'blue';
  actionRoute?: string;
  actionLabel?: string;
  updatedAt?: string;
}

export interface WorkspaceSection {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  action: string;
  cards: WorkspaceCard[];
  rows: WorkspaceRow[];
  chart?: boolean;
}