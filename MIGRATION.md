# الربط بالـ Backend

المشروع يعمل حاليًا باستخدام `MockDataProvider` مع تأخير اصطناعي قدره 300ms. الواجهات والخدمات لا تعرف مصدر البيانات.

## التبديل من Mock إلى API

في `src/environments/environment.ts` غيّر:

```ts
useMockData: true
```

إلى:

```ts
useMockData: false
```

ثم حدّث `apiBaseUrl` إلى عنوان الـAPI الحقيقي. لا تحتاج مكونات Angular أو القوالب إلى تغيير.

## الخدمات والـ endpoints

- `ProjectsService` يستخدم `GET/POST/PUT/DELETE /projects`.
- `ReportsService` يستخدم `GET/POST/PUT/DELETE /reports`.
- `IssuesService` يستخدم `GET/POST/PUT/DELETE /issues`.
- `NeedsService` يستخدم `GET/POST/PUT/DELETE /needs`.
- `EngineersService` يستخدم `GET/POST/PUT/DELETE /engineers`.
- `AnalyticsService` يستخدم `GET /analytics/summary`.

التنفيذ الحالي موجود في `HttpDataProvider`. راجع فقط أسماء المسارات وشكل الـJSON إذا اختلفت عن الـinterfaces.

## Auth

- `AuthService` يحتوي حاليًا على سلوك تجريبي.
- `authInterceptor` يضيف `Authorization: Bearer <token>` لكل طلب يملك token.
- `authGuard` يحمي صفحات الإدارة.
- عند إضافة API حقيقي، استبدل منطق `login` في `AuthService` بطلب `POST /auth/login` واحفظ token الحقيقي.

## Reactive Forms

التقرير اليومي في `daily-report-form` يستخدم Reactive Forms مع التحقق من:

- المشروع والتاريخ وحالة الموقع.
- الأعمال والملخص كحقول مطلوبة.
- حد أقصى 5 صور.
- حفظ التقرير الحالي يتم عبر `ReportsService` داخل الذاكرة التجريبية.

عند الربط الحقيقي، لا يتغير الـForm؛ يتغير تنفيذ provider فقط أو endpoint رفع الصور.

## حالات البيانات

تم تصميم الواجهات لتتعامل مع:

- `loading`: أثناء التأخير أو طلب الشبكة.
- `empty`: عند رجوع قائمة فارغة.
- `error`: عند فشل الطلب.

لاختبار حالة الخطأ في Mock provider يمكن إضافة استدعاء `failOnce()` على المجموعة المطلوبة مؤقتًا.
