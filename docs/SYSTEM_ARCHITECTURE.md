# System Architecture | هيكل النظام

## Overview | نظرة عامة

The Intelligence Investigation Platform is a comprehensive, multi-user investigation management system designed for intelligence agencies, law enforcement, and investigative teams. The platform provides visual link analysis, evidence management, timeline analysis, and AI-powered insights.

---

## Technology Stack | التقنيات المستخدمة

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| React 19 | UI library |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS 4 | Utility-first styling |
| shadcn/ui | Component library |
| React Flow (@xyflow/react) | Graph visualization |
| Zustand | State management |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | REST API endpoints |
| Prisma ORM | Database abstraction |
| SQLite | Database (development) |
| Socket.io | Real-time communication |
| JWT | Authentication |

### AI Integration
| Technology | Purpose |
|------------|---------|
| z-ai-web-dev-sdk | AI capabilities (LLM, VLM, TTS, etc.) |

---

## Architecture Layers | طبقات البنية

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Pages     │ │ Components  │ │        Hooks            ││
│  │  (Next.js)  │ │  (React)    │ │  (useCollaboration...)  ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        STATE LAYER                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  AuthStore  │ │ProjectStore │ │    DatabaseStore        ││
│  │  (Zustand)  │ │  (Zustand)  │ │      (Zustand)          ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Auth API   │ │  CRUD APIs  │ │      AI APIs            ││
│  │ /api/auth/* │ │/api/events/*│ │   /api/ai/analyze       ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Prisma    │ │  Socket.io  │ │     AI Services         ││
│  │    ORM      │ │Collaboration│ │   (z-ai-web-sdk)        ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    SQLite Database                       ││
│  │         (Users, Projects, Events, Relationships...)     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Core Modules | الوحدات الأساسية

### 1. Authentication Module
- JWT-based authentication
- Session management
- Role-based access control (RBAC)
- Password hashing with bcrypt

### 2. Project Management
- Multi-project support
- Project membership with roles (Owner, Admin, Member, Viewer)
- Project settings and configuration

### 3. Investigation Board
- Infinite canvas with React Flow
- 13 event types (Person, Location, Evidence, etc.)
- 14 relationship types
- Node clustering and grouping
- Real-time collaboration

### 4. Evidence Management
- Multiple evidence types (Document, Image, Video, Audio, etc.)
- File metadata tracking
- Chain of custody
- External link support

### 5. Timeline Analysis
- Chronological event visualization
- Zoomable timeline
- Event filtering
- Integration with investigation board

### 6. AI Analysis
- Relationship detection
- Pattern recognition
- Anomaly detection
- Investigation summary generation

### 7. Real-time Collaboration
- WebSocket-based communication
- Presence indicators
- Live cursor tracking
- Real-time updates

---

## Data Flow | تدفق البيانات

### Event Creation Flow
```
User Action → Component → Zustand Store → API Route → Prisma → Database
                    ↓
              WebSocket → Other Users
```

### Real-time Update Flow
```
User A (Edit) → API → Database → Socket.io → User B (Receive)
```

---

## Security Considerations | اعتبارات الأمان

### Authentication
- JWT tokens with expiration
- Secure HTTP-only cookies
- Password hashing (bcrypt)

### Authorization
- Role-based access control
- Project-level permissions
- Resource ownership validation

### Data Protection
- Input validation on all API routes
- SQL injection prevention (Prisma)
- XSS prevention (React)

---

## Performance Optimization | تحسين الأداء

### Frontend
- Code splitting with Next.js
- Virtual scrolling for large lists
- Memoization for expensive computations
- Optimistic UI updates

### Backend
- Database indexing
- Query optimization
- Pagination for large datasets

### Real-time
- Throttled cursor updates (50ms)
- Room-based broadcasting
- Connection pooling

---

## Scalability | القابلية للتوسع

### Horizontal Scaling
- Stateless API design
- External database support (PostgreSQL)
- Redis for session storage (optional)

### Database
- Migration to PostgreSQL for production
- Connection pooling
- Read replicas for reporting

---

## Deployment Options | خيارات النشر

### Development
```bash
bun run dev
```

### Production
- Docker containerization
- Kubernetes orchestration
- Cloud platforms (Vercel, AWS, GCP)

---

## Monitoring & Logging | المراقبة والتسجيل

### Audit Logs
- All user actions logged
- Query history
- System events

### Error Tracking
- Console logging
- Error boundaries
- API error responses

---

## Future Enhancements | تحسينات مستقبلية

1. **Map Integration** - Geographic visualization of events
2. **Advanced Search** - Full-text search with Elasticsearch
3. **Export/Import** - PDF reports, data export
4. **Mobile App** - React Native companion app
5. **Advanced AI** - Entity extraction, sentiment analysis
