import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { About } from './components/about/about';
import { Contact } from './components/contact/contact';
import { Notfound } from './components/notfound/notfound';
import { WorkspacePage } from './components/workspace-page/workspace-page';
import { DailyReportForm } from './components/daily-report-form/daily-report-form';
import { Login } from './components/login/login';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';
import { engineerGuard } from './auth/engineer.guard';
import { EngineerHome } from './components/engineer-home/engineer-home';
import { EngineerIssueForm } from './components/engineer-issue-form/engineer-issue-form';
import { EngineerReports } from './components/engineer-reports/engineer-reports';
import { EngineerForm } from './components/engineer-form/engineer-form';
import { EngineerNeedForm } from './components/engineer-need-form/engineer-need-form';

const workspace = (key: string, title: string, subtitle: string, icon: string, action: string) => ({
    component: WorkspacePage,
    canActivate: [authGuard, adminGuard],
    title,
    data: { section: { key, title, subtitle, icon, action, cards: [], rows: [] } },
});

export const routes: Routes = [
    {path:'', redirectTo: 'login', pathMatch: 'full'},
    {path:'home' , component: Home, canActivate: [authGuard, adminGuard], title: 'الرئيسية'},
    {path:'projects', ...workspace('projects', 'المشاريع', 'متابعة المشاريع وحالة مواقع العمل في مكان واحد.', 'pi pi-building', 'إضافة مشروع')},
    {path:'reports', ...workspace('reports', 'التقارير اليومية', 'مراجعة التقارير المرسلة ومتابعة الالتزام اليومي.', 'pi pi-file', 'تقرير جديد')},
    {path:'reports/new', component: DailyReportForm, canActivate: [authGuard], title: 'تقرير جديد'},
    {path:'engineer', component: EngineerHome, canActivate: [authGuard, engineerGuard], title: 'مساحة المهندس'},
    {path:'engineer/issues/new', component: EngineerIssueForm, canActivate: [authGuard, engineerGuard], title: 'تسجيل مشكلة'},
    {path:'engineer/needs/new', component: EngineerNeedForm, canActivate: [authGuard, engineerGuard], title: 'إضافة احتياج'},
    {path:'engineer/reports', component: EngineerReports, canActivate: [authGuard, engineerGuard], title: 'تقاريري'},
    {path:'issues', ...workspace('issues', 'المشاكل', 'متابعة المشاكل المفتوحة وتوثيق حالة الحل.', 'pi pi-exclamation-triangle', 'تسجيل مشكلة')},
    {path:'needs', ...workspace('needs', 'الاحتياجات', 'تنظيم طلبات المواقع ومتابعة ما تم توفيره.', 'pi pi-shopping-cart', 'طلب احتياج')},
    {path:'engineers', ...workspace('engineers', 'المهندسون', 'إدارة المهندسين والمشاريع المسندة لكل منهم.', 'pi pi-users', 'إضافة مهندس')},
    {path:'engineers/new', component: EngineerForm, canActivate: [authGuard, adminGuard], title: 'إضافة مهندس'},
    {path:'analytics', ...workspace('analytics', 'التقارير التحليلية', 'قراءة مؤشرات الأداء والالتزام عبر المشاريع.', 'pi pi-chart-bar', 'تصدير التقرير')},
    {path:'settings', ...workspace('settings', 'الإعدادات', 'إدارة تفضيلات النظام وبيانات المؤسسة.', 'pi pi-cog', 'حفظ التغييرات')},
    {path:'login', component: Login, title: 'تسجيل الدخول'},
    {path:'about',component:About,title:'عن مراقي'},
    {path:'contact',component:Contact,title:'تواصل معنا'},
    {path:'**',component:Notfound,title:'Notfound Page'}
    
];
