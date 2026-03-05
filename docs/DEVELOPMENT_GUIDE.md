# Development Guide | دليل التطوير

## Getting Started | البدء

### Prerequisites | المتطلبات

- Node.js 18+ or Bun
- Git
- A code editor (VS Code recommended)

### Installation | التثبيت

```bash
# Clone the repository
git clone https://github.com/wweziz0001/investigation-board-platform.git

# Navigate to project
cd investigation-board-platform

# Install dependencies
bun install

# Setup database
bun run db:push

# Start development server
bun run dev
```

---

## Project Structure | هيكل المشروع

```
investigation-board-platform/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin pages
│   │   └── projects/          # Project pages
│   ├── components/
│   │   ├── board/             # Investigation board components
│   │   ├── admin/             # Admin components
│   │   └── ui/                # shadcn/ui components
│   ├── stores/                # Zustand stores
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript types
├── mini-services/
│   └── collaboration-service/ # WebSocket service
├── docs/                      # Documentation
├── public/                    # Static assets
└── db/                        # SQLite database
```

---

## Development Commands | أوامر التطوير

```bash
# Start development server
bun run dev

# Run linting
bun run lint

# Push database schema
bun run db:push

# Generate Prisma client
bunx prisma generate

# Open Prisma Studio
bunx prisma studio
```

---

## Environment Variables | متغيرات البيئة

Create a `.env.local` file:

```env
# Database
DATABASE_URL="file:../db/investigation.db"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Optional: AI Integration
AI_API_KEY="your-ai-api-key"
```

---

## Coding Standards | معايير الكتابة

### TypeScript

- Use strict mode
- Define types for all functions
- Avoid `any` type
- Use interfaces for objects

```typescript
// Good
interface EventData {
  title: string;
  description?: string;
}

function createEvent(data: EventData): Promise<Event> {
  // ...
}

// Bad
function createEvent(data: any): any {
  // ...
}
```

### React Components

- Use functional components
- Use hooks for state
- Define prop types

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
```

### API Routes

- Use consistent response format
- Handle errors properly
- Validate input

```typescript
// Good
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate
    if (!body.title) {
      return apiError('Title is required', 400);
    }
    
    // Process
    const result = await createEvent(body);
    
    return apiCreated(result);
  } catch (error) {
    console.error('Error:', error);
    return apiError('Internal server error', 500);
  }
}
```

---

## Component Development | تطوير المكونات

### Using shadcn/ui

```bash
# Add a new component
npx shadcn@latest add button
npx shadcn@latest add dialog
```

### Creating Custom Components

1. Create file in appropriate directory
2. Use existing UI components
3. Export from index if needed

```typescript
// src/components/board/custom-node.tsx
'use client';

import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';

interface CustomNodeProps {
  data: {
    label: string;
    type: string;
  };
}

export function CustomNode({ data }: CustomNodeProps) {
  return (
    <Card className="p-4">
      <Handle type="target" position={Position.Left} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
```

---

## State Management | إدارة الحالة

### Using Zustand

```typescript
// src/stores/custom-store.ts
import { create } from 'zustand';

interface CustomState {
  items: Item[];
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
}

export const useCustomStore = create<CustomState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
}));
```

---

## Testing | الاختبار

### Unit Tests (when implemented)

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage
```

### Manual Testing

1. Start development server
2. Open browser to http://localhost:3000
3. Use browser DevTools for debugging

---

## Git Workflow | سير عمل Git

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/doc-name` - Documentation

### Commit Messages

```
type(scope): description

# Examples:
feat(board): add clustering support
fix(auth): resolve token expiration
docs(api): update endpoint documentation
```

### Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
```

---

## Debugging | التصحيح

### React DevTools

Install React Developer Tools browser extension for component inspection.

### API Debugging

Use `console.log` or a proper logging library:

```typescript
console.log('API Request:', request);
console.log('API Response:', response);
```

### Database Queries

Use Prisma's query logging:

```typescript
// In development
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## Performance Tips | نصائح الأداء

### React Optimization

```typescript
// Use memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
  // ...
});

// Use useMemo for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Use useCallback for functions passed to children
const handleClick = useCallback(() => {
  // ...
}, [dependency]);
```

### API Optimization

- Use pagination for large datasets
- Implement caching where appropriate
- Use database indexes

---

## Deployment | النشر

### Build for Production

```bash
# Build the application
bun run build

# Start production server
bun run start
```

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

### Environment Setup

Ensure all environment variables are set in production:
- `DATABASE_URL` - Production database URL
- `JWT_SECRET` - Secure secret key
- Any API keys needed

---

## Troubleshooting | استكشاف الأخطاء

### Common Issues

1. **Database connection error**
   - Check DATABASE_URL
   - Ensure database file exists (SQLite)
   - Run `bun run db:push`

2. **Build errors**
   - Clear `.next` directory
   - Reinstall dependencies
   - Check TypeScript errors

3. **API errors**
   - Check server logs
   - Verify request format
   - Check authentication

### Getting Help

- Check documentation in `/docs`
- Review error messages carefully
- Use browser DevTools for frontend issues
- Use server logs for backend issues
