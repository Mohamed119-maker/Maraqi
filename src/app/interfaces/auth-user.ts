export type UserRole = 'admin' | 'engineer';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  token: string;
}