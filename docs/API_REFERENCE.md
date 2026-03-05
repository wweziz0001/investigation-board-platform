# API Reference | مرجع واجهة البرمجة

## Base URL
```
/api
```

## Authentication | المصادقة

All authenticated endpoints require a valid session cookie.

### Headers
```
Cookie: session=<jwt_token>
Content-Type: application/json
```

---

## Response Format | تنسيق الاستجابة

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Authentication Endpoints | نقاط المصادقة

### POST /api/auth/login
Login user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user",
    "role": "INVESTIGATOR"
  }
}
```

---

### POST /api/auth/logout
Logout user and clear session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
Get current authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user",
    "firstName": "John",
    "lastName": "Doe",
    "role": "INVESTIGATOR"
  }
}
```

---

### POST /api/auth/register
Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "user",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## Project Endpoints | نقاط المشاريع

### GET /api/projects
List all projects user has access to.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| isArchived | boolean | Include archived |
| page | number | Page number |
| limit | number | Items per page |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project Name",
      "description": "Description",
      "status": "ACTIVE",
      "priority": "HIGH",
      "createdAt": "2025-01-01T00:00:00Z",
      "_count": {
        "events": 10,
        "members": 3
      }
    }
  ]
}
```

---

### POST /api/projects
Create new project.

**Request:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "status": "PLANNING",
  "priority": "MEDIUM"
}
```

---

### GET /api/projects/:id
Get single project with details.

---

### PUT /api/projects/:id
Update project.

**Request:**
```json
{
  "name": "Updated Name",
  "status": "ACTIVE"
}
```

---

### DELETE /api/projects/:id
Delete project (soft delete by archiving).

---

### GET /api/projects/:id/members
Get project members.

---

### POST /api/projects/:id/members
Add member to project.

**Request:**
```json
{
  "userId": "user-uuid",
  "role": "MEMBER"
}
```

---

## Event Endpoints | نقاط الأحداث

### GET /api/events
List events with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Required - Project ID |
| eventType | string | Filter by type |
| status | string | Filter by status |
| search | string | Search in title/description |
| page | number | Page number |
| limit | number | Items per page |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Event Title",
      "description": "Description",
      "eventType": "INCIDENT",
      "status": "NEW",
      "eventDate": "2025-01-01T00:00:00Z",
      "location": "Location",
      "confidence": 80,
      "importance": 90,
      "positionX": 100,
      "positionY": 200,
      "verified": false,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/events
Create new event.

**Request:**
```json
{
  "projectId": "project-uuid",
  "title": "New Event",
  "description": "Event description",
  "eventType": "INCIDENT",
  "eventDate": "2025-01-01T00:00:00Z",
  "location": "Location",
  "confidence": 80,
  "importance": 90,
  "positionX": 100,
  "positionY": 200
}
```

---

### GET /api/events/:id
Get single event with relationships.

---

### PUT /api/events/:id
Update event.

---

### DELETE /api/events/:id
Delete event.

---

## Relationship Endpoints | نقاط العلاقات

### GET /api/relationships
List relationships.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Required - Project ID |
| relationType | string | Filter by type |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sourceEventId": "event-1-uuid",
      "targetEventId": "event-2-uuid",
      "relationType": "COMMUNICATION",
      "label": "Called",
      "confidence": 75,
      "strength": 80,
      "lineStyle": "SOLID",
      "sourceEvent": { "title": "Event 1" },
      "targetEvent": { "title": "Event 2" }
    }
  ]
}
```

---

### POST /api/relationships
Create relationship.

**Request:**
```json
{
  "projectId": "project-uuid",
  "sourceEventId": "event-1-uuid",
  "targetEventId": "event-2-uuid",
  "relationType": "COMMUNICATION",
  "label": "Called",
  "confidence": 75,
  "strength": 80
}
```

---

## Evidence Endpoints | نقاط الأدلة

### GET /api/evidence
List evidence.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Required - Project ID |
| eventId | string | Filter by linked event |
| evidenceType | string | Filter by type |
| isVerified | boolean | Filter by verification |
| search | string | Search in title/description |
| page | number | Page number |
| limit | number | Items per page |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Document Title",
      "description": "Description",
      "evidenceType": "DOCUMENT",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "isVerified": true,
      "isConfidential": false,
      "accessLevel": 0,
      "collectedDate": "2025-01-01T00:00:00Z",
      "collectedBy": "Investigator Name"
    }
  ]
}
```

---

### POST /api/evidence
Create evidence.

**Request:**
```json
{
  "projectId": "project-uuid",
  "eventId": "event-uuid",
  "title": "Evidence Title",
  "description": "Description",
  "evidenceType": "DOCUMENT",
  "fileName": "document.pdf",
  "filePath": "/uploads/document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "collectedDate": "2025-01-01T00:00:00Z",
  "collectedBy": "Investigator Name"
}
```

---

### GET /api/evidence/:id
Get single evidence.

---

### PUT /api/evidence/:id
Update evidence.

---

### DELETE /api/evidence/:id
Delete evidence.

---

## Comment Endpoints | نقاط التعليقات

### GET /api/comments
List comments.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Required - Project ID |
| eventId | string | Filter by event |
| relationshipId | string | Filter by relationship |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Comment text",
      "userId": "user-uuid",
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "avatar": null
      },
      "replies": [],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/comments
Create comment.

**Request:**
```json
{
  "projectId": "project-uuid",
  "eventId": "event-uuid",
  "content": "Comment text",
  "parentId": "parent-comment-uuid"
}
```

---

## AI Analysis Endpoints | نقاط تحليل الذكاء الاصطناعي

### POST /api/ai/analyze
Run AI analysis on project data.

**Request:**
```json
{
  "projectId": "project-uuid",
  "analysisType": "relationships"
}
```

**Analysis Types:**
| Type | Description |
|------|-------------|
| relationships | Detect potential relationships |
| patterns | Identify patterns in data |
| anomalies | Find anomalies and outliers |
| summary | Generate investigation summary |

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "relationships",
    "suggestions": [
      {
        "sourceId": "event-1-uuid",
        "targetId": "event-2-uuid",
        "relationType": "COMMUNICATION",
        "label": "Potential connection",
        "confidence": 0.85,
        "reasoning": "Both events occurred at similar location..."
      }
    ]
  }
}
```

---

## Admin Endpoints | نقاط الإدارة

### GET /api/users
List all users (Admin only).

### GET /api/users/:id
Get user details.

### PUT /api/users/:id
Update user.

### DELETE /api/users/:id
Delete user.

---

## Database Manager Endpoints | نقاط مدير قاعدة البيانات

### GET /api/admin/db/tables
Get all database tables.

### POST /api/admin/db/query
Execute SQL query.

**Request:**
```json
{
  "query": "SELECT * FROM User LIMIT 10"
}
```

### GET /api/admin/db/metrics
Get database metrics.

---

## Error Codes | رموز الأخطاء

| Code | Description |
|------|-------------|
| UNAUTHORIZED | User not authenticated |
| FORBIDDEN | User lacks permission |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Invalid input data |
| CONFLICT | Resource already exists |
| INTERNAL_ERROR | Server error |

---

## Rate Limiting | تحديد المعدل

API requests are rate limited:
- **Authenticated**: 100 requests/minute
- **Unauthenticated**: 20 requests/minute

---

## WebSocket Events | أحداث WebSocket

### Connection
```javascript
const socket = io("/?XTransformPort=3003");
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join-project | Client → Server | Join project room |
| leave-project | Client → Server | Leave project room |
| event-created | Server → Client | New event created |
| event-updated | Server → Client | Event updated |
| event-deleted | Server → Client | Event deleted |
| cursor-move | Client → Server | Cursor position update |
| user-presence | Server → Client | User presence update |
