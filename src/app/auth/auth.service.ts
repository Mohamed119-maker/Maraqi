import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, of, throwError, switchMap } from 'rxjs';
import { AuthUser, UserRole } from '../interfaces/auth-user';
import { EngineersService } from '../services/engineers.service';
import { Engineer } from '../interfaces/engineer';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'maraqi-demo-user';
  private readonly sessionStorageKey = 'maraqi-session-user';
  private readonly adminPhone = '01090262739';
  private readonly adminPassword = '123456789';
  private readonly engineersStorageKey = 'maraqi-engineers';
  private readonly userState = signal<AuthUser | null>(this.readUser());
  readonly currentUser = this.userState.asReadonly();
  private readonly engineers = inject(EngineersService);

  login(phone: string, password: string, rememberMe = false): Observable<AuthUser> {
    if (phone === this.adminPhone && password === this.adminPassword) return this.completeLogin({ id: 'demo-admin', name: 'مدير مراقي', phone, role: 'admin', token: 'demo-jwt-token' }, rememberMe);
    return this.engineers.getAll().pipe(switchMap((engineers) => {
      const availableEngineers = [...engineers, ...this.readStoredEngineers()];
      const engineer = availableEngineers.find((item) => item.phone === phone && item.password === password);
      return engineer ? this.completeLogin({ id: engineer.id, name: engineer.name, phone: engineer.phone, role: 'engineer', token: 'demo-jwt-token' }, rememberMe) : throwError(() => new Error('بيانات الدخول غير صحيحة'));
    }));
  }

  forgotPassword(phone: string): Observable<{ message: string }> {
    return of({ message: `تم إرسال تعليمات الاستعادة إلى الرقم ${phone}` }).pipe(delay(300));
  }

  logout(): void {
    this.userState.set(null);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(this.storageKey);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.sessionStorageKey);
  }

  isAuthenticated(): boolean {
    return this.userState() !== null;
  }

  getToken(): string | null {
    return this.userState()?.token ?? null;
  }

  getRole(): UserRole | null {
    return this.userState()?.role ?? null;
  }

  getUser(): AuthUser | null {
    return this.userState();
  }

  private readUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    const storedUser = localStorage.getItem(this.storageKey) ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.sessionStorageKey) : null);
    if (!storedUser) return null;
    try { return JSON.parse(storedUser) as AuthUser; } catch { return null; }
  }

  private persistUser(user: AuthUser): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  private completeLogin(user: AuthUser, rememberMe: boolean): Observable<AuthUser> {
    this.userState.set(user);
    if (rememberMe) this.persistUser(user);
    else if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(user));
    return of(user).pipe(delay(300));
  }

  persistEngineer(engineer: Engineer): void {
    if (typeof localStorage === 'undefined') return;
    const engineers = this.readStoredEngineers().filter((item) => item.id !== engineer.id);
    localStorage.setItem(this.engineersStorageKey, JSON.stringify([...engineers, engineer]));
  }

  private readStoredEngineers(): Engineer[] {
    if (typeof localStorage === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(this.engineersStorageKey) ?? '[]') as Engineer[]; } catch { return []; }
  }
}