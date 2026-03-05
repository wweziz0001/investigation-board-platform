# Investigation Board Engine | محرك لوحة التحقيق

## Overview | نظرة عامة

The Investigation Board is the core visualization component of the platform, built on React Flow (@xyflow/react). It provides an infinite canvas for mapping entities (events) and their relationships visually.

---

## Technology Stack | التقنيات المستخدمة

| Library | Version | Purpose |
|---------|---------|---------|
| @xyflow/react | v12 | Graph visualization |
| React | v19 | UI rendering |
| Zustand | v4 | State management |
| Tailwind CSS | v4 | Styling |

---

## Architecture | البنية

```
┌─────────────────────────────────────────────────────────────┐
│                    InvestigationBoard                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    ReactFlow Provider                    ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐││
│  │  │  EventNode  │ │Relationship │ │   BoardToolbar      │││
│  │  │  (Custom)   │ │    Edge     │ │   (Controls)        │││
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                 MiniMap / Overview                   │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components | المكونات الأساسية

### 1. InvestigationBoard

Main container component that orchestrates the entire board.

**Location:** `src/components/board/investigation-board.tsx`

**Props:**
```typescript
interface InvestigationBoardProps {
  projectId: string;
}
```

**Features:**
- Infinite canvas with zoom (10% - 200%)
- Pan and drag navigation
- Multi-selection support
- Keyboard shortcuts
- Context menu actions
- Real-time collaboration

---

### 2. EventNode

Custom node component representing an entity on the board.

**Location:** `src/components/board/event-node.tsx`

**Node Types:**
```typescript
const nodeTypes = {
  event: EventNode,
};
```

**Visual Elements:**
- Event type icon
- Title and description
- Status indicator
- Confidence/importance bars
- Verification badge
- Lock indicator
- Connection handles

**Node Structure:**
```tsx
<div className="event-node">
  <Handle type="target" position={Position.Left} />
  
  {/* Header */}
  <div className="node-header">
    <EventTypeIcon />
    <Badge>{status}</Badge>
  </div>
  
  {/* Content */}
  <div className="node-content">
    <Title />
    <Description />
    <Metadata />
  </div>
  
  {/* Indicators */}
  <div className="node-indicators">
    <ConfidenceBar />
    <ImportanceBar />
  </div>
  
  <Handle type="source" position={Position.Right} />
</div>
```

---

### 3. RelationshipEdge

Custom edge component showing relationships between events.

**Location:** `src/components/board/relationship-edge.tsx`

**Edge Types:**
```typescript
const edgeTypes = {
  relationship: RelationshipEdge,
};
```

**Edge Styles:**
| Style | Description |
|-------|-------------|
| Solid | Strong connection |
| Dashed | Moderate connection |
| Dotted | Weak/tentative connection |

**Features:**
- Animated edges for active connections
- Confidence-based coloring
- Hover labels with relationship info
- Click to select/edit

---

### 4. BoardToolbar

Toolbar with board controls and actions.

**Location:** `src/components/board/board-toolbar.tsx`

**Actions:**
- Add Event
- Zoom In/Out
- Fit View
- Toggle MiniMap
- Undo/Redo
- Export Board

---

### 5. EventDialog

Dialog for creating/editing events.

**Location:** `src/components/board/event-dialog.tsx`

**Fields:**
- Title (required)
- Description
- Event Type (dropdown)
- Status (dropdown)
- Event Date/Time
- Location
- Confidence (slider)
- Importance (slider)
- Tags

---

### 6. RelationshipDialog

Dialog for creating/editing relationships.

**Location:** `src/components/board/relationship-dialog.tsx`

**Fields:**
- Source Event (auto-filled)
- Target Event (auto-filled)
- Relationship Type (dropdown)
- Label
- Description
- Confidence (slider)
- Strength (slider)
- Line Style

---

## State Management | إدارة الحالة

### ProjectStore

Zustand store managing all board state.

**Location:** `src/stores/project-store.ts`

**State Shape:**
```typescript
interface ProjectState {
  // Data
  projectId: string | null;
  project: Project | null;
  events: Event[];
  relationships: Relationship[];
  clusters: Cluster[];
  
  // Selection
  selectedEventIds: string[];
  selectedRelationshipIds: string[];
  hoveredEventId: string | null;
  
  // UI State
  searchQuery: string;
  filters: FilterState;
  boardSettings: BoardSettings;
  isLoading: boolean;
  isSaving: boolean;
  
  // Viewport
  viewport: { x: number; y: number; zoom: number };
}
```

**Key Actions:**
```typescript
// Event Actions
loadProject(projectId: string): Promise<void>
addEvent(event: Event): void
updateEvent(id: string, data: Partial<Event>): void
deleteEvent(id: string): void

// Relationship Actions
addRelationship(relationship: Relationship): void
updateRelationship(id: string, data: Partial<Relationship>): void
deleteRelationship(id: string): void

// Selection Actions
selectEvent(id: string, multi?: boolean): void
selectRelationship(id: string): void
clearSelection(): void

// Viewport Actions
setViewport(viewport: Viewport): void
fitView(): void
zoomToNode(nodeId: string): void
```

---

## Event Types | أنواع الأحداث

Each event type has a unique icon and color:

| Type | Icon | Color |
|------|------|-------|
| GENERAL | Circle | Gray |
| INCIDENT | AlertTriangle | Red |
| EVIDENCE | FileCheck | Blue |
| SUSPECT | UserX | Orange |
| WITNESS | Eye | Green |
| LOCATION | MapPin | Teal |
| TIMELINE | Clock | Purple |
| DOCUMENT | FileText | Indigo |
| COMMUNICATION | MessageSquare | Cyan |
| FINANCIAL | DollarSign | Yellow |
| TRAVEL | Plane | Pink |
| MEETING | Users | Brown |
| CUSTOM | Star | Custom |

---

## Relationship Types | أنواع العلاقات

| Type | Description | Default Style |
|------|-------------|---------------|
| RELATED | General connection | Solid |
| EVIDENCE | Evidence link | Dashed |
| TIMELINE | Temporal sequence | Dotted |
| CAUSAL | Cause-effect | Solid, Animated |
| SUSPECT | Suspect involvement | Solid, Red |
| WITNESS | Witness connection | Dashed |
| LOCATION | Location link | Dotted |
| COMMUNICATION | Communication | Dashed, Animated |
| FINANCIAL | Financial connection | Solid, Green |
| FAMILY | Family relationship | Solid, Purple |
| ASSOCIATE | Known associate | Dashed |
| VEHICLE | Vehicle connection | Dotted |
| ORGANIZATION | Organization link | Solid |
| CUSTOM | Custom relationship | Configurable |

---

## Keyboard Shortcuts | اختصارات لوحة المفاتيح

| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected |
| `Ctrl+A` | Select all |
| `Ctrl+D` | Deselect all |
| `Ctrl+C` | Copy selected |
| `Ctrl+V` | Paste |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+F` | Search |
| `Ctrl+Plus` | Zoom in |
| `Ctrl+Minus` | Zoom out |
| `Ctrl+0` | Fit view |
| `Space` (hold) | Pan mode |
| `Escape` | Cancel/Deselect |

---

## Performance Optimization | تحسين الأداء

### Virtualization
The board uses React Flow's built-in virtualization to only render nodes within the viewport.

### Large Dataset Handling
For boards with 10,000+ nodes:

1. **Clustering**: Group related nodes into clusters
2. **Level of Detail**: Simplify node rendering at low zoom levels
3. **Lazy Loading**: Load node details on demand
4. **Viewport Culling**: Only render visible nodes

```typescript
// Example: Level of detail rendering
const NodeRenderer = ({ zoom, event }) => {
  if (zoom < 0.3) {
    return <MinimalNode event={event} />;
  }
  if (zoom < 0.7) {
    return <CompactNode event={event} />;
  }
  return <FullNode event={event} />;
};
```

### Edge Optimization
- Use `edgeUpdaterRadius` for better edge interaction
- Disable animations for large numbers of edges
- Use `panOnDrag` with `selectionOnDrag` for better UX

---

## Customization | التخصيص

### Custom Node Types
```typescript
const customNodeTypes = {
  event: EventNode,
  location: LocationNode,
  person: PersonNode,
  // Add custom types
};

<ReactFlow nodeTypes={customNodeTypes} />
```

### Custom Edge Types
```typescript
const customEdgeTypes = {
  relationship: RelationshipEdge,
  timeline: TimelineEdge,
  // Add custom types
};

<ReactFlow edgeTypes={customEdgeTypes} />
```

### Custom Styles
```css
/* Node customization */
.react-flow__node-event {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Edge customization */
.react-flow__edge-relationship {
  stroke-width: 2px;
}
```

---

## Export & Import | التصدير والاستيراد

### Export Board
```typescript
const exportBoard = () => {
  const data = {
    events: events,
    relationships: relationships,
    viewport: getViewport(),
    settings: boardSettings,
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  downloadBlob(blob, `board-${projectId}.json`);
};
```

### Import Board
```typescript
const importBoard = async (file: File) => {
  const data = JSON.parse(await file.text());
  
  // Validate and import
  for (const event of data.events) {
    await createEvent(event);
  }
  
  for (const rel of data.relationships) {
    await createRelationship(rel);
  }
};
```

---

## Integration Points | نقاط التكامل

### Real-time Collaboration
```typescript
// Listen for remote updates
useEffect(() => {
  socket.on('event-created', (event) => {
    addEvent(event);
  });
  
  socket.on('event-updated', ({ id, data }) => {
    updateEvent(id, data);
  });
  
  return () => {
    socket.off('event-created');
    socket.off('event-updated');
  };
}, []);
```

### AI Integration
```typescript
// AI-suggested relationships
const handleAISuggestion = (suggestion) => {
  // Create edge with dashed style to indicate AI-suggested
  const edge = {
    id: `ai-${suggestion.id}`,
    source: suggestion.sourceId,
    target: suggestion.targetId,
    type: 'relationship',
    data: {
      aiSuggested: true,
      confidence: suggestion.confidence,
    },
    style: { strokeDasharray: '5,5' },
  };
  
  addEdge(edge);
};
```

---

## Troubleshooting | استكشاف الأخطاء

### Common Issues

1. **Nodes not rendering**
   - Check `nodeTypes` registration
   - Verify node data structure

2. **Edges not connecting**
   - Check handle IDs
   - Verify `source` and `target` match node IDs

3. **Performance issues**
   - Reduce node complexity
   - Enable clustering
   - Check for unnecessary re-renders

4. **Zoom/pan not working**
   - Check `panOnDrag` and `zoomOnScroll` props
   - Verify no conflicting event handlers
