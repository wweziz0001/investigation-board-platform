# Investigation Board Platform
# منصة لوحة التحقيق

<div align="center">
  <img src="https://via.placeholder.com/1200x600/1e293b/ffffff?text=Investigation+Board+Platform" alt="Investigation Board Platform" width="100%">
  
  <h3>Professional Intelligence Investigation Platform</h3>
  <h4>منصة تحقيقات استخباراتية متكاملة</h4>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
</div>

---

## 🚀 Features | الميزات

### Core Functionality | الوظائف الأساسية
- **Investigation Projects** - Create and manage multiple investigation projects with isolated workspaces
- **Infinite Canvas Board** - Zoomable, pannable canvas supporting thousands of events
- **Entity Types** - 13 entity types (Person, Event, Location, Organization, Evidence, etc.)
- **Relationship System** - 14 relationship types (Communication, Financial, Family, etc.)
- **Evidence Management** - Upload and manage files, documents, and evidence with chain of custody
- **Timeline Analysis** - Chronological visualization of events with zoomable timeline
- **AI Analysis** - AI-powered relationship detection, pattern recognition, and summaries
- **Real-time Collaboration** - Live updates with WebSocket support
- **Comments System** - Threaded comments and annotations

### Investigation Board | لوحة التحقيق
- **React Flow Powered** - Built on @xyflow/react for performance
- **Custom Nodes & Edges** - Purpose-built event and relationship components
- **Node Clustering** - Group related entities visually
- **Search & Filter** - Find events by type, status, date, or content
- **Export/Import** - JSON export for backup and sharing

### Admin Dashboard | لوحة الإدارة
- **User Management** - Create, edit, delete users with role assignment
- **Project Oversight** - View and manage all projects
- **Database Manager** - SQL editor, table browser, backup system
- **Code Editor** - Monaco-powered file editor for system files

---

## 📋 Tech Stack | التقنيات

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **State** | Zustand |
| **Board** | @xyflow/react (React Flow v12) |
| **Database** | Prisma ORM, SQLite |
| **Auth** | JWT, bcryptjs |
| **Real-time** | Socket.io |
| **AI** | z-ai-web-dev-sdk |
| **Icons** | Lucide React |

---

## 🏃 Getting Started | البدء

### Prerequisites | المتطلبات
- Node.js 18+ or Bun
- SQLite (included)

### Installation | التثبيت

```bash
# Clone the repository
git clone https://github.com/wweziz0001/investigation-board-platform.git

# Install dependencies
bun install

# Setup database
bun run db:push

# Start development server
bun run dev

# Start collaboration service (in another terminal)
cd mini-services/collaboration-service && bun --hot index.ts
```

### Default Admin Account | حساب المدير الافتراضي

| Field | Value |
|-------|-------|
| Email | admin@investigation.com |
| Password | Admin@123456 |

---

## 📁 Project Structure | هيكل المشروع

```
investigation-board-platform/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── api/             # API routes
│   │   ├── login/           # Login page
│   │   ├── projects/        # Project workspace
│   │   └── register/        # Registration page
│   ├── components/
│   │   ├── admin/           # Admin components
│   │   ├── board/           # Investigation board components
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   └── stores/              # Zustand stores
├── mini-services/
│   └── collaboration-service/ # WebSocket service
├── docs/                    # Documentation
├── db/                      # SQLite database files
└── public/                  # Static assets
```

---

## 🔐 User Roles | أدوار المستخدمين

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, database management |
| **Investigator** | Create/edit projects, events, relationships, evidence |
| **Viewer** | View-only access to assigned projects |

---

## 📊 Entity Types | أنواع الكيانات

| Type | Description |
|------|-------------|
| GENERAL | General event |
| INCIDENT | Incident/crime event |
| EVIDENCE | Evidence discovery |
| SUSPECT | Suspect information |
| WITNESS | Witness statement |
| LOCATION | Location of interest |
| TIMELINE | Timeline marker |
| DOCUMENT | Document reference |
| COMMUNICATION | Communication record |
| FINANCIAL | Financial transaction |
| TRAVEL | Travel/movement |
| MEETING | Meeting/encounter |
| CUSTOM | Custom event type |

---

## 🔗 Relationship Types | أنواع العلاقات

| Type | Description |
|------|-------------|
| RELATED | General relation |
| EVIDENCE | Evidence connection |
| TIMELINE | Temporal sequence |
| CAUSAL | Causal relationship |
| COMMUNICATION | Communication link |
| FINANCIAL | Financial connection |
| FAMILY | Family relationship |
| ASSOCIATE | Known associate |
| ORGANIZATION | Organization link |
| And more... | ... |

---

## 📚 Documentation | الوثائق

- [System Architecture](./docs/SYSTEM_ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Investigation Board Engine](./docs/INVESTIGATION_BOARD_ENGINE.md)
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- [AI Integration](./docs/AI_INTEGRATION.md)

---

## 🔌 API Endpoints | نقاط API

### Authentication | المصادقة
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Core Resources | الموارد الأساسية
- `GET|POST /api/projects` - Projects
- `GET|POST /api/events` - Events
- `GET|POST /api/relationships` - Relationships
- `GET|POST /api/evidence` - Evidence
- `GET|POST /api/comments` - Comments

### AI Analysis | تحليل الذكاء الاصطناعي
- `POST /api/ai/analyze` - Run AI analysis

### Admin | الإدارة
- `GET /api/users` - User management
- `GET /api/admin/db/*` - Database management

---

## 🎨 Screenshots | لقطات الشاشة

### Investigation Board
![Investigation Board](https://via.placeholder.com/800x500/1e293b/ffffff?text=Investigation+Board)

### Timeline View
![Timeline View](https://via.placeholder.com/800x500/1e293b/ffffff?text=Timeline+View)

### Evidence Management
![Evidence Management](https://via.placeholder.com/800x500/1e293b/ffffff?text=Evidence+Management)

### AI Analysis
![AI Analysis](https://via.placeholder.com/800x500/1e293b/ffffff?text=AI+Analysis)

---

## 📝 License | الرخصة

MIT License - See LICENSE file for details.

---

## 🤝 Contributing | المساهمة

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

---

## 📧 Support | الدعم

For support, email support@investigation-board.com or open an issue.

---

<div align="center">
  <p>Built with ❤️ for intelligence analysts and investigators worldwide</p>
</div>
