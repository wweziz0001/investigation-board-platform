# دليل التطوير والمساهمة | Development & Contribution Guide

## 📋 نظرة عامة | Overview

هذا الدليل يشرح منهجية التوثيق وإدارة الإصدارات في مشروع **منصة لوحة التحقيق** (Investigation Board Platform). عند العمل على هذا المشروع، يجب اتباع هذه التعليمات بدقة لضمان الاتساق والجودة.

---

## 🔄 منهجية التوثيق | Documentation Methodology

### ترقيم الإصدارات | Version Numbering

نستخدم نظام **Semantic Versioning** (الإصدارات الدلالية):

```
MAJOR.MINOR.PATCH (مثال: 1.0.0)
```

| النوع | الرمز | متى يُستخدم | مثال |
|-------|-------|------------|-------|
| **MAJOR** | `X.0.0` | تغييرات جذرية أو إعادة بناء كاملة | 1.0.0 → 2.0.0 |
| **MINOR** | `1.X.0` | إضافة ميزات جديدة | 1.0.0 → 1.1.0 |
| **PATCH** | `1.0.X` | إصلاح أخطاء ومشاكل | 1.0.0 → 1.0.1 |

### الرموز المستخدمة | Symbols Used

| الرمز | المعنى |
|-------|--------|
| 🟢 | كود جديد (تمت إضافته) |
| 🔴 | كود قديم (تمت إزالته) |
| 🔧 | إصلاح خطأ |
| ✨ | ميزة جديدة |
| 📝 | توثيق |
| 🎨 | تحسينات التصميم |
| ⚡ | تحسينات الأداء |

---

## 📁 هيكل ملفات التوثيق | Documentation Files Structure

```
investigation-board-platform/
├── VERSION                    # الإصدار الحالي (رقم واحد فقط)
├── changelog/
│   ├── CHANGELOG.md          # سجل كل الإصدارات
│   └── v1.0.0.md             # تفاصيل الإصدار المحدد
├── AI_INSTRUCTIONS.md         # تعليمات للنماذج الذكية
├── DEVELOPMENT_GUIDE.md       # هذا الملف
├── README.md                  # وصف المشروع
└── DATABASE_SCHEMA.md         # مخطط قاعدة البيانات
```

---

## 🚀 خطوات إصدار تحديث جديد | Steps for New Release

### عند إصلاح مشكلة (Patch) | When Fixing a Bug

```bash
# 1. قراءة الإصدار الحالي
cat VERSION
# مثال: 1.0.0

# 2. تحديث VERSION إلى 1.0.1
echo "1.0.1" > VERSION

# 3. إنشاء ملف التغييرات التفصيلية
# إنشاء changelog/v1.0.1.md
```

**محتوى ملف changelog/vX.X.X.md:**
```markdown
# [X.X.X] - YYYY-MM-DD

## 🔧 الإصلاحات

### عنوان الإصلاح

**المشكلة:**
وصف واضح للمشكلة التي كانت موجودة.

**السبب:**
شرح السبب الجذري للمشكلة.

**الحل:**
وصف الحل المطبق.

**الملفات المتأثرة:**
- `path/to/file1.ts` - وصف التغيير
- `path/to/file2.tsx` - وصف التغيير

**النتيجة:**
- ✅ نتائج الإصلاح
```

### عند إضافة ميزة (Minor) | When Adding a Feature

```bash
# 1. تحديث VERSION من 1.0.0 إلى 1.1.0
echo "1.1.0" > VERSION

# 2. إنشاء changelog/v1.1.0.md
```

### عند تغيير جذري (Major) | When Major Change

```bash
# 1. تحديث VERSION من 1.0.0 إلى 2.0.0
echo "2.0.0" > VERSION

# 2. إنشاء changelog/v2.0.0.md مع توثيق شامل
```

---

## 📤 الرفع إلى GitHub | Push to GitHub

### الخطوات المطلوبة | Required Steps

بعد إكمال أي تغيير، يجب تنفيذ الخطوات التالية:

```bash
# 1. التحقق من الملفات المتغيرة
git status

# 2. إنشاء فرع جديد باسم الإصدار
git checkout -b vX.X.X

# 3. إضافة جميع الملفات
git add .

# 4. إنشاء commit مع رسالة واضحة
git commit -m "Release vX.X.X: وصف مختصر"

# 5. رفع الفرع إلى GitHub
git push origin vX.X.X
```

### إذا كان التوكن مطلوباً | If Token is Required

```bash
# استخدام التوكن في الرابط
git push https://<TOKEN>@github.com/wweziz0001/investigation-board-platform.git vX.X.X
```

---

## ⚠️ قواعد مهمة | Important Rules

### ✅ يجب فعله | Must Do

1. **توثيق دقيق**: كل تغيير يجب أن يكون موثقاً بشكل واضح
2. **فرع منفصل**: كل إصدار له فرع خاص به
3. **رسائل Commit واضحة**: استخدام تنسيق موحد
4. **تحديث VERSION**: دائماً تحديث رقم الإصدار
5. **تحديث CHANGELOG.md**: إضافة ملخص للتغييرات

### ❌ لا يجب فعله | Must Not Do

1. **لا تعمل commit مباشر على main**: دائماً أنشئ فرع
2. **لا تتخطى التوثيق**: حتى التغييرات الصغيرة تحتاج توثيق
3. **لا تحذف ملفات changelog**: جميع ملفات الإصدارات محفوظة
4. **لا تغير VERSION بدون سبب**: كل تغيير له معنى

---

## 🔧 التقنيات المستخدمة | Technologies Used

| الفئة | التقنية | الإصدار |
|-------|---------|---------|
| **Framework** | Next.js | 16 |
| **UI Library** | React | 19 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS | 4 |
| **Components** | shadcn/ui | New York |
| **State Management** | Zustand | 5 |
| **Board Engine** | @xyflow/react | 12 |
| **Database ORM** | Prisma | 6 |
| **Database** | SQLite | 3 |
| **Authentication** | JWT | - |
| **Password Hashing** | bcryptjs | - |
| **Icons** | Lucide React | - |

---

## 📂 هيكل المشروع | Project Structure

```
investigation-board-platform/
├── prisma/
│   └── schema.prisma          # مخطط قاعدة البيانات
├── src/
│   ├── app/
│   │   ├── admin/             # لوحة الإدارة
│   │   ├── api/               # واجهات API
│   │   ├── login/             # تسجيل الدخول
│   │   ├── projects/          # صفحات المشاريع
│   │   └── register/          # التسجيل
│   ├── components/
│   │   ├── admin/             # مكونات الإدارة
│   │   ├── board/             # مكونات اللوحة
│   │   └── ui/                # مكونات shadcn
│   ├── hooks/                 # React Hooks
│   ├── lib/                   # المكتبات المساعدة
│   └── stores/                # مخازن Zustand
├── changelog/                 # سجلات التغييرات
├── scripts/                   # سكربتات المساعدة
├── VERSION                    # رقم الإصدار
├── README.md                  # توثيق المشروع
├── DATABASE_SCHEMA.md         # مخطط قاعدة البيانات
├── AI_INSTRUCTIONS.md         # تعليمات الذكاء الاصطناعي
└── DEVELOPMENT_GUIDE.md       # هذا الملف
```

---

## 🔍 Checklist قبل الإنهاء | Pre-completion Checklist

قبل إكمال أي إصدار، تأكد من:

- [ ] تم تحديث ملف `VERSION`
- [ ] تم إنشاء ملف `changelog/vX.X.X.md`
- [ ] تم تحديث `changelog/CHANGELOG.md`
- [ ] تم إنشاء فرع جديد
- [ ] تم عمل commit مع رسالة واضحة
- [ ] تم رفع الفرع إلى GitHub
- [ ] تم التحقق من عمل جميع الصفحات (/, /admin, /login)

---

## ✅ التحقق من تشغيل النظام | System Running Verification

### ⚠️ قاعدة مهمة جداً

**لا يُعتبر تشغيل الـ dev server كتشغيل ناجح للنظام!**

مجرد ظهور رسالة `✓ Ready in XXXms` **لا يعني** أن النظام يعمل بشكل صحيح.

### 🎯 المتطلبات الإلزامية للتحقق

```bash
# التحقق من جميع الواجهات الرئيسية
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ && echo " - Homepage"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin && echo " - Admin"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login && echo " - Login"

# النتيجة المتوقعة:
# 200 - Homepage
# 200 - Admin
# 200 - Login
```

---

## 📞 معلومات المستودع | Repository Info

- **GitHub**: https://github.com/wweziz0001/investigation-board-platform
- **المؤلف**: wweziz0001
- **تاريخ آخر تحديث**: 2025-03-05
- **الإصدار الحالي**: 1.0.0

---

## 📞 للنماذج الذكية الأخرى | For Other AI Models

عند العمل على هذا المشروع، أنت مطالب بـ:

1. **قراءة هذا الملف أولاً**: لفهم منهجية العمل
2. **قراءة `AI_INSTRUCTIONS.md`**: لفهم التعليمات التفصيلية
3. **قراءة آخر إصدار في `changelog/`**: لمعرفة آخر التغييرات
4. **قراءة `VERSION`**: لمعرفة الإصدار الحالي
5. **اتباع الخطوات المذكورة أعلاه**: بدقة عند أي تغيير

---

**تذكر**: التوثيق الجيد هو أساس أي مشروع ناجح!
