export interface Engineer {
  id: string;
  name: string;
  phone: string;
  password?: string;
  photoUrl?: string;
  email?: string;
  assignedProjectIds: string[];
  isActive: boolean;
}