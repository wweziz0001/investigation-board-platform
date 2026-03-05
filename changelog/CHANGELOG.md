# سجل التغييرات | Changelog

جميع التغييرات الملحوظة في هذا المشروع سيتم توثيقها في هذا الملف.

All notable changes to this project will be documented in this file.

---

## [1.0.3] - 2025-03-06

### 🔧 الإصلاحات

#### إصلاح عرض المستخدمين في لوحة الإدارة

**المشكلة:**
المستخدمون لا يظهرون في صفحة إدارة المستخدمين `/admin/users`.

**السبب:**
- صفحة المستخدمين تبحث عن البيانات في `data.users`
- لكن API يعيد البيانات في `data.data`

**الملفات المتأثرة:**
- `src/app/admin/users/page.tsx` - تصحيح قراءة البيانات

**التفاصيل:** انظر `changelog/v1.0.3.md`

---

## [1.0.2] - 2025-03-05

### 🔧 الإصلاحات

#### 1. إصلاح الدوال المفقودة في auth.ts

**المشكلة:**
دوال `hasProjectAccess` و `ROLE_HIERARCHY` مطلوبة في API routes لكنها لم تكن مُصدّرة.

**الملفات المتأثرة:**
- `src/lib/auth.ts` - إضافة الدوال المفقودة

**التفاصيل:** انظر `changelog/v1.0.2.md`

#### 2. إصلاح database-store.ts

**المشكلة:**
خصائص مفقودة في `DatabaseState` تسبب أخطاء في مدير قاعدة البيانات.

**الملفات المتأثرة:**
- `src/stores/database-store.ts` - إضافة الخصائص المفقودة

**التفاصيل:** انظر `changelog/v1.0.2.md`

#### 3. إصلاح project-store.ts

**المشكلة:**
أنواع `EventType` و `EventStatus` لا تطابق القيم المستخدمة في الواجهة.

**الملفات المتأثرة:**
- `src/stores/project-store.ts` - تحديث الأنواع

**التفاصيل:** انظر `changelog/v1.0.2.md`

#### 4. إصلاح مكونات لوحة التحقيق

**المشكلة:**
أخطاء TypeScript في React Flow components.

**الملفات المتأثرة:**
- `src/components/board/investigation-board.tsx`
- `src/components/board/event-node.tsx`
- `src/components/board/relationship-edge.tsx`
- `src/components/board/side-panel.tsx`

**التفاصيل:** انظر `changelog/v1.0.2.md`

#### 5. إصلاح المصادقة في admin/layout.tsx

**المشكلة:**
إعادة توجيه إلى صفحة تسجيل الدخول بعد تسجيل الدخول بنجاح.

**السبب:**
التحقق من `isAuthenticated` قبل استدعاء `checkAuth()`.

**الملفات المتأثرة:**
- `src/app/admin/layout.tsx` - إضافة التحقق من المصادقة

**التفاصيل:** انظر `changelog/v1.0.2.md`

#### 6. إصلاح admin/db-manager/page.tsx

**المشكلة:**
خطأ `Cannot read properties of undefined (reading 'totalTables')`.

**الملفات المتأثرة:**
- `src/app/admin/db-manager/page.tsx` - إضافة null checks

**التفاصيل:** انظر `changelog/v1.0.2.md`

---

## [1.0.1] - 2025-03-05

### 🔧 الإصلاحات

#### إصلاح دالة getAuthUser المفقودة

**المشكلة:**
جميع API routes كانت تفشل بخطأ 500 بسبب عدم وجود دالة `getAuthUser` في ملف `src/lib/auth.ts`.

**السبب:**
دالة `getAuthUser` كانت مستخدمة في جميع API routes لكنها لم تكن مُصدّرة من ملف auth.ts.

**الملفات المتأثرة:**
- `src/lib/auth.ts` - إضافة دالة getAuthUser

**التفاصيل:** انظر `changelog/v1.0.1.md`

---

## [1.0.0] - 2025-03-05

### ✨ الإصدار الأولي | Initial Release

#### المشروع الجديد | New Project

إطلاق منصة لوحة التحقيق (Investigation Board Platform) - نظام تحقيقات استخباراتي متكامل.

**الميزات الرئيسية:**

##### 🎯 إدارة المشاريع التحقيقية
- إنشاء وإدارة مشاريع تحقيق متعددة
- عزل كامل لبيانات كل مشروع
- أدوار أعضاء (مالك، مدير، عضو، مشاهد)
- حالات المشروع (تخطيط، نشاط، متوقف، مكتمل، مؤرشف)

##### 📋 لوحة التحقيق اللانهائية
- لوحة رسم تفاعلية بمساحة غير محدودة
- تكبير وتصغير سلس
- سحب وإفلات العقد
- بحث وتصفية الأحداث
- تصدير واستيراد البيانات

##### 📊 عقد الأحداث
- 13 نوع من الأحداث (حادثة، دليل، مشتبه، شاهد، موقع، إلخ)
- ترميز لوني حسب النوع
- مستويات الثقة والأهمية (0-100)
- تواريخ ومواقع الأحداث
- قفل وحماية الأحداث

##### 🔗 نظام العلاقات
- 14 نوع من العلاقات (دليل، تسلسل زمني، سببي، عائلي، إلخ)
- تخصيص مظهر الخطوط (صلب، متقطع، منقط)
- رسوم متحركة للخطوط
- تسميات ووصف العلاقات

##### 👥 نظام المستخدمين
- تسجيل ودخول آمن
- أدوار المستخدمين (مدير، محقق، مشاهد)
- صلاحيات متدرجة

##### ⚙️ لوحة الإدارة
- إدارة المستخدمين
- إدارة المشاريع
- مدير قاعدة البيانات
- محرر الأكواد

---

### 📁 الملفات المتأثرة | Affected Files

#### قاعدة البيانات
- `prisma/schema.prisma` - مخطط قاعدة البيانات الشامل

#### API Endpoints
- `src/app/api/auth/login/route.ts` - تسجيل الدخول
- `src/app/api/auth/logout/route.ts` - تسجيل الخروج
- `src/app/api/auth/me/route.ts` - المستخدم الحالي
- `src/app/api/auth/register/route.ts` - التسجيل
- `src/app/api/events/route.ts` - إدارة الأحداث
- `src/app/api/events/[id]/route.ts` - حدث واحد
- `src/app/api/projects/route.ts` - إدارة المشاريع
- `src/app/api/projects/[id]/route.ts` - مشروع واحد
- `src/app/api/projects/[id]/members/route.ts` - أعضاء المشروع
- `src/app/api/relationships/route.ts` - إدارة العلاقات
- `src/app/api/relationships/[id]/route.ts` - علاقة واحدة
- `src/app/api/users/route.ts` - إدارة المستخدمين
- `src/app/api/users/[id]/route.ts` - مستخدم واحد
- `src/app/api/admin/db/tables/route.ts` - جداول قاعدة البيانات
- `src/app/api/admin/db/query/route.ts` - تنفيذ استعلامات SQL
- `src/app/api/admin/db/schema/route.ts` - مخطط قاعدة البيانات
- `src/app/api/admin/db/backup/route.ts` - النسخ الاحتياطي
- `src/app/api/admin/db/audit-logs/route.ts` - سجلات التدقيق
- `src/app/api/admin/db/metrics/route.ts` - إحصائيات قاعدة البيانات
- `src/app/api/admin/db/saved-queries/route.ts` - الاستعلامات المحفوظة

#### مكونات الواجهة
- `src/components/board/investigation-board.tsx` - لوحة التحقيق الرئيسية
- `src/components/board/event-node.tsx` - عقدة الحدث
- `src/components/board/relationship-edge.tsx` - حافة العلاقة
- `src/components/board/event-dialog.tsx` - حوار إنشاء/تعديل الحدث
- `src/components/board/relationship-dialog.tsx` - حوار إنشاء/تعديل العلاقة
- `src/components/board/board-toolbar.tsx` - شريط أدوات اللوحة
- `src/components/admin/database/database-manager.tsx` - مدير قاعدة البيانات
- `src/components/admin/database/sql-editor.tsx` - محرر SQL
- `src/components/admin/database/schema-visualizer.tsx` - مخطط قاعدة البيانات
- `src/components/admin/database/data-editor.tsx` - محرر البيانات

#### الصفحات
- `src/app/page.tsx` - الصفحة الرئيسية
- `src/app/login/page.tsx` - صفحة تسجيل الدخول
- `src/app/register/page.tsx` - صفحة التسجيل
- `src/app/projects/[id]/page.tsx` - صفحة المشروع
- `src/app/admin/page.tsx` - لوحة الإدارة
- `src/app/admin/users/page.tsx` - إدارة المستخدمين
- `src/app/admin/projects/page.tsx` - إدارة المشاريع
- `src/app/admin/db-manager/page.tsx` - مدير قاعدة البيانات
- `src/app/admin/code-editor/page.tsx` - محرر الأكواد

#### المخازن (Stores)
- `src/stores/auth-store.ts` - حالة المصادقة
- `src/stores/project-store.ts` - حالة المشروع
- `src/stores/database-store.ts` - حالة قاعدة البيانات

#### المكتبات المساعدة
- `src/lib/auth.ts` - المصادقة والتوكينات
- `src/lib/db-permissions.ts` - صلاحيات قاعدة البيانات
- `src/lib/admin-helpers.ts` - مساعدات الإدارة
- `src/lib/api-utils.ts` - أدوات API

---

### 🛠️ التقنيات المستخدمة | Technologies Used

| الفئة | التقنية |
|-------|---------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand |
| Board | @xyflow/react (React Flow v12) |
| Database | Prisma ORM + SQLite |
| Auth | JWT + bcryptjs |

---

### 📊 الإحصائيات | Statistics

| العنصر | العدد |
|--------|-------|
| الملفات المُنشأة | 51+ |
| سطور الكود | 13,621+ |
| API Endpoints | 15+ |
| صفحات الواجهة | 12 |
| نماذج قاعدة البيانات | 15 |

---

**التفاصيل الكاملة:** انظر `changelog/v1.0.0.md`
