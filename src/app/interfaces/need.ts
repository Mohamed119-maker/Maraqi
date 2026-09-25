export type NeedPriority = 'high' | 'medium';
export type NeedStatus = 'pending' | 'provided';

export interface Need {
  id: string;
  projectId: string;
  itemName: string;
  quantity: number;
  priority: NeedPriority;
  status: NeedStatus;
  createdAt: string;
}