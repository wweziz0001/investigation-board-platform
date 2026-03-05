# Investigation Board Platform

A professional, collaborative investigation platform for intelligence analysts, detectives, and law enforcement to create, manage, and visualize investigation projects with infinite canvas boards.

![Investigation Board](https://via.placeholder.com/1200x600/1e293b/ffffff?text=Investigation+Board+Platform)

## 🚀 Features

### Core Functionality
- **Investigation Projects** - Create and manage multiple investigation projects with isolated workspaces
- **Infinite Canvas Board** - Zoomable, pannable canvas supporting thousands of events
- **Event Nodes** - Rich event nodes with metadata, tagging, and evidence linking
- **Relationship System** - Connect events with typed relationships (evidence, timeline, causal, etc.)
- **Evidence Management** - Upload and manage files, documents, and evidence
- **User Management** - Role-based access control (Admin, Investigator, Viewer)

### Investigation Board
- **React Flow Powered** - Built on @xyflow/react for performance
- **Custom Nodes & Edges** - Purpose-built event and relationship components
- **Search & Filter** - Find events by type, status, date, or content
- **Export/Import** - JSON export for backup and sharing
- **Real-time Updates** - Automatic position saving

### Admin Dashboard
- **User Management** - Create, edit, delete users with role assignment
- **Project Oversight** - View and manage all projects
- **Database Manager** - SQL editor, table browser, backup system
- **Code Editor** - Monaco-powered file editor for system files

## 📋 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **State** | Zustand, TanStack Query |
| **Board** | @xyflow/react (React Flow v12) |
| **Editor** | Monaco Editor |
| **Database** | Prisma ORM, SQLite |
| **Auth** | JWT, bcryptjs |
| **Icons** | Lucide React |

## 🏃 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- SQLite (included)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/investigation-board.git

# Install dependencies
bun install

# Setup database
bun run db:push

# Start development server
bun run dev
```

### Default Admin Account

After running `db:push`, create an admin user through the registration page, then manually update their role to `ADMIN` in the database.

## 📁 Project Structure

```
investigation-board/
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
├── db/                      # SQLite database files
└── public/                  # Static assets
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, database management |
| **Investigator** | Create/edit projects, events, relationships, evidence |
| **Viewer** | View-only access to assigned projects |

## 📊 Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

### Core Models
- **User** - Authentication and authorization
- **Project** - Investigation project container
- **Event** - Node on the investigation board
- **Relationship** - Connection between events
- **Evidence** - Files and attachments
- **Note** - Text notes on events/projects

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Events
- `GET /api/events` - List events (filter by project)
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get event
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Relationships
- `GET /api/relationships` - List relationships
- `POST /api/relationships` - Create relationship
- `GET /api/relationships/[id]` - Get relationship
- `PUT /api/relationships/[id]` - Update relationship
- `DELETE /api/relationships/[id]` - Delete relationship

### Admin
- `GET /api/admin/db/tables` - List database tables
- `POST /api/admin/db/query` - Execute SQL query
- `GET /api/admin/db/metrics` - Database metrics
- `GET /api/admin/db/backup` - List backups
- `POST /api/admin/db/backup` - Create backup

## 🎨 Customization

### Event Types
Edit `src/components/board/event-node.tsx` to customize event types:

```typescript
const EVENT_TYPE_CONFIG: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  GENERAL: { icon: FileText, label: 'General', color: '#6b7280' },
  INCIDENT: { icon: AlertCircle, label: 'Incident', color: '#ef4444' },
  // Add custom types...
};
```

### Relationship Types
Edit `src/components/board/relationship-edge.tsx` to customize relationship types:

```typescript
const RELATIONSHIP_LABELS: Record<string, string> = {
  RELATED: 'Related',
  EVIDENCE: 'Evidence',
  // Add custom types...
};
```

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📧 Support

For support, email support@investigation-board.com or open an issue.
