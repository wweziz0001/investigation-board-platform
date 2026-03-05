# Database Schema | مخطط قاعدة البيانات

## Overview | نظرة عامة

The Intelligence Investigation Platform uses Prisma ORM with SQLite (development) or PostgreSQL (production). This document describes all database models, their relationships, and important considerations.

---

## Entity Relationship Diagram | مخطط العلاقات

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    User     │       │     Project     │       │    Event    │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id          │──┐    │ id              │──┐    │ id          │
│ email       │  │    │ name            │  │    │ title       │
│ username    │  │    │ description     │  │    │ eventType   │
│ passwordHash│  │    │ status          │  │    │ status      │
│ role        │  │    │ priority        │  │    │ positionX   │
│ ...         │  │    │ ...             │  │    │ positionY   │
└─────────────┘  │    └─────────────────┘  │    │ ...         │
       │         │           │             │    └─────────────┘
       │         │           │             │           │
       │    ┌────┘           │             │           │
       │    │                │             │           │
       ▼    ▼                ▼             │           │
┌─────────────────┐  ┌─────────────────┐   │           │
│  ProjectMember  │  │   Evidence      │   │           │
├─────────────────┤  ├─────────────────┤   │           │
│ id              │  │ id              │   │           │
│ projectId       │  │ projectId       │   │           │
│ userId          │  │ eventId         │◄──┼───────────┘
│ role            │  │ title           │   │
└─────────────────┘  │ evidenceType    │   │
                     │ ...             │   │
                     └─────────────────┘   │
                                           │
┌─────────────────┐                        │
│  Relationship   │                        │
├─────────────────┤                        │
│ id              │                        │
│ projectId       │                        │
│ sourceEventId   │◄───────────────────────┘
│ targetEventId   │◄───────────────────────┘
│ relationType    │
│ ...             │
└─────────────────┘
```

---

## Models | النماذج

### User | المستخدم

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  avatar        String?
  role          UserRole  @default(INVESTIGATOR)
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  projects          ProjectMember[]
  ownedProjects     Project[]        @relation("ProjectOwner")
  createdEvents     Event[]
  createdEvidence   Evidence[]
  createdNotes      Note[]
  createdRelations  Relationship[]
  auditLogs         AuditLog[]
  savedQueries      SavedQuery[]
  comments          Comment[]

  @@index([email])
  @@index([username])
  @@index([role])
}
```

**Indexes:**
- `email` - For login lookups
- `username` - For profile lookups
- `role` - For role-based queries

---

### UserRole | دور المستخدم

```prisma
enum UserRole {
  ADMIN        // Full system access
  INVESTIGATOR // Can create/edit projects and events
  VIEWER       // Read-only access
}
```

---

### Project | المشروع

```prisma
model Project {
  id            String        @id @default(uuid())
  name          String
  description   String?
  status        ProjectStatus @default(ACTIVE)
  priority      ProjectPriority @default(MEDIUM)
  startDate     DateTime?
  endDate       DateTime?
  boardViewport String?       // JSON: { x, y, zoom }
  boardSettings String?       // JSON: { gridSize, snapToGrid }
  isArchived    Boolean       @default(false)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  createdById   String
  createdBy     User          @relation("ProjectOwner")

  // Relations
  members       ProjectMember[]
  events        Event[]
  relationships Relationship[]
  evidence      Evidence[]
  notes         Note[]
  tags          Tag[]
  clusters      Cluster[]
  comments      Comment[]

  @@index([status])
  @@index([createdById])
  @@index([isArchived])
}
```

---

### ProjectStatus | حالة المشروع

```prisma
enum ProjectStatus {
  PLANNING     // Initial planning phase
  ACTIVE       // Active investigation
  PAUSED       // Temporarily paused
  COMPLETED    // Investigation completed
  ARCHIVED     // Archived for reference
}
```

---

### ProjectPriority | أولوية المشروع

```prisma
enum ProjectPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

### ProjectMember | عضو المشروع

```prisma
model ProjectMember {
  id        String        @id @default(uuid())
  projectId String
  userId    String
  role      MemberRole    @default(MEMBER)
  joinedAt  DateTime      @default(now())
  project   Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}
```

---

### MemberRole | دور العضو

```prisma
enum MemberRole {
  OWNER     // Full control including deletion
  ADMIN     // Can manage members and settings
  MEMBER    // Can add/edit events and evidence
  VIEWER    // Read-only access
}
```

---

### Event | الحدث (العقدة على اللوحة)

```prisma
model Event {
  id              String        @id @default(uuid())
  projectId       String
  title           String
  description     String?
  eventDate       DateTime?
  eventTime       String?
  location        String?
  locationCoords  String?       // JSON: { lat, lng }
  eventType       EventType     @default(GENERAL)
  status          EventStatus   @default(NEW)
  confidence      Int           @default(50)   // 0-100
  importance      Int           @default(50)   // 0-100
  verified        Boolean       @default(false)

  // Board Position
  positionX       Float         @default(0)
  positionY       Float         @default(0)
  width           Int           @default(280)
  height          Int           @default(200)
  zIndex          Int           @default(0)
  isExpanded      Boolean       @default(true)
  isLocked        Boolean       @default(false)
  color           String?

  // Metadata
  externalId      String?
  source          String?
  reliability     Int           @default(50)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdById     String
  createdBy       User          @relation(fields: [createdById], references: [id])

  // Relations
  project         Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  evidence        Evidence[]
  notes           Note[]
  tags            EventTag[]
  cluster         Cluster?      @relation(fields: [clusterId], references: [id])
  clusterId       String?
  sourceRelations  Relationship[] @relation("EventSource")
  targetRelations  Relationship[] @relation("EventTarget")
  comments        Comment[]

  @@index([projectId])
  @@index([eventType])
  @@index([status])
  @@index([eventDate])
  @@index([clusterId])
}
```

---

### EventType | نوع الحدث

```prisma
enum EventType {
  GENERAL       // General event
  INCIDENT      // Incident/crime event
  EVIDENCE      // Evidence discovery
  SUSPECT       // Suspect information
  WITNESS       // Witness statement
  LOCATION      // Location of interest
  TIMELINE      // Timeline marker
  DOCUMENT      // Document reference
  COMMUNICATION // Communication record
  FINANCIAL     // Financial transaction
  TRAVEL        // Travel/movement
  MEETING       // Meeting/encounter
  CUSTOM        // Custom event type
}
```

---

### EventStatus | حالة الحدث

```prisma
enum EventStatus {
  NEW           // Newly created
  INVESTIGATING // Under investigation
  VERIFIED      // Verified and confirmed
  DISPUTED      // Information disputed
  DISMISSED     // No longer relevant
  ARCHIVED      // Archived
}
```

---

### Relationship | العلاقة (الحافة على اللوحة)

```prisma
model Relationship {
  id              String            @id @default(uuid())
  projectId       String
  sourceEventId   String
  targetEventId   String
  relationType    RelationType      @default(RELATED)
  label           String?
  description     String?
  strength        Int               @default(50)  // 0-100
  confidence      Int               @default(50)  // 0-100
  color           String?

  // Visual properties
  lineStyle       LineStyle         @default(SOLID)
  lineWidth       Int               @default(2)
  isAnimated      Boolean           @default(false)
  isCurved        Boolean           @default(true)

  // Metadata
  evidence        String?
  source          String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  createdById     String
  createdBy       User              @relation(fields: [createdById], references: [id])

  // Relations
  project         Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceEvent     Event             @relation("EventSource", fields: [sourceEventId], references: [id], onDelete: Cascade)
  targetEvent     Event             @relation("EventTarget", fields: [targetEventId], references: [id], onDelete: Cascade)
  notes           Note[]
  comments        Comment[]

  @@index([projectId])
  @@index([sourceEventId])
  @@index([targetEventId])
  @@index([relationType])
}
```

---

### RelationType | نوع العلاقة

```prisma
enum RelationType {
  RELATED       // General relation
  EVIDENCE      // Evidence connection
  TIMELINE      // Temporal sequence
  CAUSAL        // Causal relationship
  SUSPECT       // Suspect involvement
  WITNESS       // Witness connection
  LOCATION      // Location connection
  COMMUNICATION // Communication link
  FINANCIAL     // Financial connection
  FAMILY        // Family relationship
  ASSOCIATE     // Known associate
  VEHICLE       // Vehicle connection
  ORGANIZATION  // Organization link
  CUSTOM        // Custom relationship
}
```

---

### LineStyle | نمط الخط

```prisma
enum LineStyle {
  SOLID
  DASHED
  DOTTED
}
```

---

### Evidence | الدليل

```prisma
model Evidence {
  id              String          @id @default(uuid())
  projectId       String
  eventId         String?
  title           String
  description     String?
  evidenceType    EvidenceType    @default(DOCUMENT)
  fileName        String?
  filePath        String?
  fileSize        Int?
  mimeType        String?
  hash            String?

  // External links
  externalUrl     String?
  externalSource  String?

  // Metadata
  collectedDate   DateTime?
  collectedBy     String?
  chainOfCustody  String?         // JSON array
  isVerified      Boolean         @default(false)
  isConfidential  Boolean         @default(false)
  accessLevel     Int             @default(0)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  createdById     String
  createdBy       User            @relation(fields: [createdById], references: [id])

  // Relations
  project         Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  event           Event?          @relation(fields: [eventId], references: [id], onDelete: SetNull)
  notes           Note[]

  @@index([projectId])
  @@index([eventId])
  @@index([evidenceType])
}
```

---

### EvidenceType | نوع الدليل

```prisma
enum EvidenceType {
  DOCUMENT      // PDF, DOC, etc.
  IMAGE         // Photos, screenshots
  VIDEO         // Video recordings
  AUDIO         // Audio recordings
  EMAIL         // Email correspondence
  MESSAGE       // Chat/SMS messages
  FINANCIAL     // Financial records
  LOCATION      // GPS/Location data
  PHYSICAL      // Physical evidence photos
  WEB           // Web page/archive
  DATABASE      // Database export
  OTHER         // Other evidence type
}
```

---

### Comment | التعليق

```prisma
model Comment {
  id            String    @id @default(uuid())
  projectId     String
  eventId       String?
  relationshipId String?
  userId        String
  content       String
  parentId      String?   // For threaded comments
  position      String?   // JSON: { x, y } for annotations

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  event         Event?    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  relationship  Relationship? @relation(fields: [relationshipId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  replies       Comment[] @relation("CommentReplies")
  parent        Comment?  @relation("CommentReplies", fields: [parentId], references: [id])

  @@index([projectId])
  @@index([eventId])
  @@index([userId])
}
```

---

## Supporting Models | النماذج المساعدة

### Note | الملاحظة
```prisma
model Note {
  id            String      @id @default(uuid())
  projectId     String
  eventId       String?
  relationshipId String?
  evidenceId    String?
  content       String      // Markdown
  noteType      NoteType    @default(GENERAL)
  isPinned      Boolean     @default(false)
  isPrivate     Boolean     @default(false)
  // ... relations
}
```

### Tag | الوسم
```prisma
model Tag {
  id          String      @id @default(uuid())
  projectId   String
  name        String
  color       String      @default("#6366f1")
  description String?
  // ... relations
}
```

### Cluster | المجموعة
```prisma
model Cluster {
  id          String    @id @default(uuid())
  projectId   String
  name        String
  description String?
  color       String    @default("#3b82f6")
  positionX   Float     @default(0)
  positionY   Float     @default(0)
  width       Int       @default(400)
  height      Int       @default(300)
  isCollapsed Boolean   @default(false)
  // ... relations
}
```

### AuditLog | سجل التدقيق
```prisma
model AuditLog {
  id            String      @id @default(uuid())
  userId        String?
  action        String
  resourceType  String
  resourceId    String?
  resourceName  String?
  details       String?     // JSON
  query         String?
  ipAddress     String?
  userAgent     String?
  status        String      @default("success")
  errorMessage  String?
  timestamp     DateTime    @default(now())
  // ... relations
}
```

---

## Migration Guide | دليل الترحيل

### Development
```bash
# Push schema changes
bun run db:push

# Generate Prisma Client
bunx prisma generate
```

### Production (PostgreSQL)
```bash
# Create migration
bunx prisma migrate dev --name init

# Deploy migration
bunx prisma migrate deploy
```

---

## Best Practices | أفضل الممارسات

1. **Always use transactions** for multi-step operations
2. **Use indexes** for frequently queried fields
3. **Cascade deletes** carefully to avoid data loss
4. **Validate input** before database operations
5. **Use Prisma's type safety** to catch errors at compile time
