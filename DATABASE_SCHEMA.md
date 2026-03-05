# Database Schema

This document describes the database schema for the Investigation Board Platform.

## Overview

The platform uses Prisma ORM with SQLite for data persistence. The schema is designed to support:
- Multi-tenant investigation projects
- Role-based access control
- Visual investigation board with events and relationships
- Evidence and file management
- Audit logging

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│    User     │────<│  ProjectMember  │>────│   Project   │
└─────────────┘     └─────────────────┘     └─────────────┘
      │                                            │
      │                                            │
      ▼                                            ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  AuditLog   │     │      Event      │<────│    Tag      │
└─────────────┘     └─────────────────┘     └─────────────┘
                          │    │
                          │    │
                          ▼    ▼
                    ┌─────────────────┐
                    │  Relationship   │
                    └─────────────────┘
                          │
                          ▼
                    ┌─────────────────┐
                    │    Evidence     │
                    └─────────────────┘
```

## Tables

### User

Stores user accounts and authentication information.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| email | String | Unique email address |
| username | String | Unique username |
| passwordHash | String | Bcrypt hashed password |
| firstName | String? | First name |
| lastName | String? | Last name |
| avatar | String? | Avatar URL |
| role | UserRole | User role (ADMIN, INVESTIGATOR, VIEWER) |
| isActive | Boolean | Account active status |
| lastLoginAt | DateTime? | Last login timestamp |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Indexes:** email, username, role

```prisma
enum UserRole {
  ADMIN        // Full system access
  INVESTIGATOR // Can create/edit projects and events
  VIEWER       // Read-only access
}
```

### Project

Investigation project container.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Project name |
| description | String? | Project description |
| status | ProjectStatus | Project status |
| priority | ProjectPriority | Project priority |
| startDate | DateTime? | Investigation start date |
| endDate | DateTime? | Investigation end date |
| boardViewport | String? | JSON viewport state |
| boardSettings | String? | JSON board settings |
| isArchived | Boolean | Archive flag |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| createdById | String | Owner user ID |

**Indexes:** status, createdById, isArchived

```prisma
enum ProjectStatus {
  PLANNING    // Initial planning phase
  ACTIVE      // Active investigation
  PAUSED      // Temporarily paused
  COMPLETED   // Investigation completed
  ARCHIVED    // Archived for reference
}

enum ProjectPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### ProjectMember

Junction table for project membership.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| projectId | String | Project ID |
| userId | String | User ID |
| role | MemberRole | Member role in project |
| joinedAt | DateTime | Join timestamp |

**Unique Constraint:** (projectId, userId)

```prisma
enum MemberRole {
  OWNER   // Full control including deletion
  ADMIN   // Can manage members and settings
  MEMBER  // Can add/edit events and evidence
  VIEWER  // Read-only access
}
```

### Event

Investigation event node on the board.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| projectId | String | Project ID |
| title | String | Event title |
| description | String? | Event description |
| eventDate | DateTime? | When the event occurred |
| eventTime | String? | Time of the event |
| location | String? | Event location |
| locationCoords | String? | JSON coordinates |
| eventType | EventType | Type of event |
| status | EventStatus | Event status |
| confidence | Int | Confidence level (0-100) |
| importance | Int | Importance level (0-100) |
| verified | Boolean | Verification status |
| positionX | Float | Board X position |
| positionY | Float | Board Y position |
| width | Int | Node width |
| height | Int | Node height |
| zIndex | Int | Z-index for layering |
| isExpanded | Boolean | Node expansion state |
| isLocked | Boolean | Lock state |
| color | String? | Custom color (hex) |
| externalId | String? | External reference ID |
| source | String? | Information source |
| reliability | Int | Source reliability (0-100) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| createdById | String | Creator user ID |
| clusterId | String? | Cluster ID if grouped |

**Indexes:** projectId, eventType, status, eventDate, clusterId

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

enum EventStatus {
  NEW           // Newly created
  INVESTIGATING // Under investigation
  VERIFIED      // Verified and confirmed
  DISPUTED      // Information disputed
  DISMISSED     // No longer relevant
  ARCHIVED      // Archived
}
```

### Relationship

Connection between events.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| projectId | String | Project ID |
| sourceEventId | String | Source event ID |
| targetEventId | String | Target event ID |
| relationType | RelationType | Type of relationship |
| label | String? | Custom label |
| description | String? | Relationship description |
| strength | Int | Relationship strength (0-100) |
| confidence | Int | Confidence in relationship (0-100) |
| color | String? | Custom color (hex) |
| lineStyle | LineStyle | Line style (SOLID, DASHED, DOTTED) |
| lineWidth | Int | Line width in pixels |
| isAnimated | Boolean | Animation flag |
| isCurved | Boolean | Curved line flag |
| evidence | String? | Supporting evidence |
| source | String? | Relationship source |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| createdById | String | Creator user ID |

**Indexes:** projectId, sourceEventId, targetEventId, relationType

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

enum LineStyle {
  SOLID
  DASHED
  DOTTED
}
```

### Evidence

Files and attachments.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| projectId | String | Project ID |
| eventId | String? | Associated event ID |
| title | String | Evidence title |
| description | String? | Evidence description |
| evidenceType | EvidenceType | Type of evidence |
| fileName | String? | Original filename |
| filePath | String? | Storage path |
| fileSize | Int? | File size in bytes |
| mimeType | String? | MIME type |
| hash | String? | File hash for integrity |
| externalUrl | String? | External URL |
| externalSource | String? | External source |
| collectedDate | DateTime? | Collection date |
| collectedBy | String? | Collector name |
| chainOfCustody | String? | JSON custody records |
| isVerified | Boolean | Verification status |
| isConfidential | Boolean | Confidential flag |
| accessLevel | Int | Access level (0-3) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| createdById | String | Creator user ID |

**Indexes:** projectId, eventId, evidenceType

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

### Note

Text notes on events, relationships, or evidence.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| projectId | String | Project ID |
| eventId | String? | Event ID |
| relationshipId | String? | Relationship ID |
| evidenceId | String? | Evidence ID |
| content | String | Markdown content |
| noteType | NoteType | Type of note |
| isPinned | Boolean | Pinned status |
| isPrivate | Boolean | Private note flag |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| createdById | String | Creator user ID |

**Indexes:** projectId, eventId, createdById

```prisma
enum NoteType {
  GENERAL       // General note
  HYPOTHESIS    // Investigation hypothesis
  QUESTION      // Question to investigate
  TODO          // Task/todo item
  FINDING       // Key finding
  SUMMARY       // Summary note
  ANALYSIS      // Analysis notes
}
```

### Tag

Tags for event categorization.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| projectId | String | Project ID |
| name | String | Tag name |
| color | String | Tag color (hex) |
| description | String? | Tag description |

**Unique Constraint:** (projectId, name)

### EventTag

Junction table for event tags.

| Field | Type | Description |
|-------|------|-------------|
| eventId | String | Event ID |
| tagId | String | Tag ID |

**Primary Key:** (eventId, tagId)

### Cluster

Grouping of events on the board.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| projectId | String | Project ID |
| name | String | Cluster name |
| description | String? | Cluster description |
| color | String | Cluster color (hex) |
| positionX | Float | Board X position |
| positionY | Float | Board Y position |
| width | Int | Cluster width |
| height | Int | Cluster height |
| isCollapsed | Boolean | Collapse state |

**Index:** projectId

### AuditLog

System audit trail.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String? | User ID |
| action | String | Action performed |
| resourceType | String | Resource type |
| resourceId | String? | Resource ID |
| resourceName | String? | Resource name |
| details | String? | JSON details |
| ipAddress | String? | Client IP |
| userAgent | String? | Client user agent |
| status | String | Operation status |
| createdAt | DateTime | Timestamp |

**Indexes:** userId, action, resourceType, createdAt

### SavedQuery

Saved database queries for admin.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | User ID |
| name | String | Query name |
| description | String? | Query description |
| query | String | SQL query |
| isFavorite | Boolean | Favorite flag |
| tags | String? | JSON array of tags |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| lastUsedAt | DateTime? | Last usage timestamp |

**Indexes:** userId, isFavorite

### SystemSetting

System configuration settings.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| key | String | Setting key (unique) |
| value | String | JSON value |
| category | String | Setting category |
| description | String? | Setting description |
| updatedAt | DateTime | Last update timestamp |

**Index:** key, category

### DatabaseBackup

Database backup records.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Backup name |
| type | String | Backup type (full, schema, data) |
| size | Int | Backup size in bytes |
| status | String | Backup status |
| filePath | String? | Backup file path |
| checksum | String? | Backup checksum |
| createdAt | DateTime | Creation timestamp |
| createdBy | String? | Creator user ID |

**Indexes:** status, createdAt

## Relations

### User Relations
- `projects` → ProjectMember[]
- `ownedProjects` → Project[]
- `createdEvents` → Event[]
- `createdEvidence` → Evidence[]
- `createdNotes` → Note[]
- `createdRelations` → Relationship[]
- `auditLogs` → AuditLog[]
- `savedQueries` → SavedQuery[]

### Project Relations
- `members` → ProjectMember[]
- `events` → Event[]
- `relationships` → Relationship[]
- `evidence` → Evidence[]
- `notes` → Note[]
- `tags` → Tag[]
- `clusters` → Cluster[]

### Event Relations
- `project` → Project
- `evidence` → Evidence[]
- `notes` → Note[]
- `tags` → EventTag[]
- `cluster` → Cluster?
- `sourceRelations` → Relationship[]
- `targetRelations` → Relationship[]

### Relationship Relations
- `project` → Project
- `sourceEvent` → Event
- `targetEvent` → Event
- `notes` → Note[]

### Evidence Relations
- `project` → Project
- `event` → Event?
- `notes` → Note[]

## Migration History

1. **Initial Schema** - Core models: User, Project, Event, Relationship
2. **Evidence System** - Added Evidence, Note models
3. **Tagging System** - Added Tag, EventTag models
4. **Clustering** - Added Cluster model
5. **Audit & Admin** - Added AuditLog, SavedQuery, SystemSetting, DatabaseBackup

## Performance Considerations

### Indexes
- All foreign keys are indexed
- Frequently queried fields (status, type, date) are indexed
- Full-text search is handled at the application level

### Caching
- Board state is cached in Zustand with localStorage persistence
- API responses should implement appropriate cache headers
- Consider Redis for production deployments

### Scaling
For large-scale deployments:
1. Migrate from SQLite to PostgreSQL
2. Implement connection pooling
3. Add read replicas for reporting
4. Consider time-series partitioning for audit logs
