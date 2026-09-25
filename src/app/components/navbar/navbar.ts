import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../interfaces/nav-item';
import { NotificationsService } from '../../services/notifications.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  isMobile = signal(false);
  open = signal(true);
  collapsed = signal(false);
  private mql?: MediaQueryList;
  private mqlListener?: (event: MediaQueryListEvent) => void;
  readonly notifications = inject(NotificationsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly currentUser = this.auth.currentUser;
  readonly navItems = computed<NavItem[]>(() => this.currentUser()?.role === 'engineer' ? [
    { label: 'مساحتي', route: '/engineer', icon: 'pi pi-home', exact: true },
    { label: 'تقرير جديد', route: '/reports/new', icon: 'pi pi-file-edit' },
    { label: 'تقاريري', route: '/engineer/reports', icon: 'pi pi-history' },
    { label: 'تسجيل مشكلة', route: '/engineer/issues/new', icon: 'pi pi-exclamation-triangle' },
    { label: 'إضافة احتياج', route: '/engineer/needs/new', icon: 'pi pi-shopping-cart' },
  ] : [
    { label: 'الرئيسية', route: '/home', icon: 'pi pi-home', exact: true },
    { label: 'المشاريع', route: '/projects', icon: 'pi pi-building' },
    { label: 'التقارير', route: '/reports', icon: 'pi pi-file' },
    { label: 'المشاكل', route: '/issues', icon: 'pi pi-exclamation-triangle' },
    { label: 'الاحتياجات', route: '/needs', icon: 'pi pi-shopping-cart' },
    { label: 'المهندسون', route: '/engineers', icon: 'pi pi-users' },
    { label: 'التقارير التحليلية', route: '/analytics', icon: 'pi pi-chart-bar' },
    { label: 'الإعدادات', route: '/settings', icon: 'pi pi-cog' },
  ]);

  ngOnInit() {
    if (typeof window === 'undefined') return;
    this.mql = window.matchMedia('(max-width: 899px)');
    this.isMobile.set(this.mql.matches);
    this.open.set(!this.mql.matches);
    this.setContentSidebarWidth(this.mql.matches ? '0px' : '232px');
    this.mqlListener = (event) => {
      this.isMobile.set(event.matches);
      this.open.set(!event.matches);
      this.collapsed.set(false);
      this.setContentSidebarWidth(event.matches ? '0px' : '232px');
    };
    this.mql.addEventListener('change', this.mqlListener);
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.open.update((value) => !value);
      return;
    }

    const isCollapsed = !this.collapsed();
    this.collapsed.set(isCollapsed);
    this.setContentSidebarWidth(isCollapsed ? '72px' : '232px');
  }

  unreadNotifications() {
    return this.notifications.unreadCount(this.currentUser()?.id, this.currentUser()?.role);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private setContentSidebarWidth(width: string) {
    document.documentElement.style.setProperty('--maraqi-sidebar-width', width);
  }

  ngOnDestroy() {
    this.mql?.removeEventListener('change', this.mqlListener!);
  }
}
