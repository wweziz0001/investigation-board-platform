'use client';

import * as React from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Table, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDatabaseStore } from '@/stores/database-store';
import { cn } from '@/lib/utils';

// Schema data from Prisma
const schemaData = {
  User: {
    columns: [
      { name: 'id', type: 'String', primaryKey: true },
      { name: 'email', type: 'String', unique: true },
      { name: 'username', type: 'String', unique: true },
      { name: 'passwordHash', type: 'String' },
      { name: 'firstName', type: 'String?' },
      { name: 'lastName', type: 'String?' },
      { name: 'role', type: 'UserRole' },
      { name: 'isActive', type: 'Boolean' },
      { name: 'createdAt', type: 'DateTime' },
      { name: 'updatedAt', type: 'DateTime' },
    ],
    relations: [
      { to: 'Project', name: 'ownedProjects', type: 'one-to-many' },
      { to: 'ProjectMember', name: 'projects', type: 'one-to-many' },
      { to: 'Event', name: 'createdEvents', type: 'one-to-many' },
    ],
  },
  Project: {
    columns: [
      { name: 'id', type: 'String', primaryKey: true },
      { name: 'name', type: 'String' },
      { name: 'description', type: 'String?' },
      { name: 'status', type: 'ProjectStatus' },
      { name: 'priority', type: 'ProjectPriority' },
      { name: 'isArchived', type: 'Boolean' },
      { name: 'createdById', type: 'String', foreignKey: true },
      { name: 'createdAt', type: 'DateTime' },
    ],
    relations: [
      { to: 'User', name: 'createdBy', type: 'many-to-one' },
      { to: 'Event', name: 'events', type: 'one-to-many' },
      { to: 'ProjectMember', name: 'members', type: 'one-to-many' },
    ],
  },
  Event: {
    columns: [
      { name: 'id', type: 'String', primaryKey: true },
      { name: 'projectId', type: 'String', foreignKey: true },
      { name: 'title', type: 'String' },
      { name: 'description', type: 'String?' },
      { name: 'eventType', type: 'EventType' },
      { name: 'status', type: 'EventStatus' },
      { name: 'positionX', type: 'Float' },
      { name: 'positionY', type: 'Float' },
      { name: 'createdById', type: 'String', foreignKey: true },
    ],
    relations: [
      { to: 'Project', name: 'project', type: 'many-to-one' },
      { to: 'User', name: 'createdBy', type: 'many-to-one' },
      { to: 'Relationship', name: 'sourceRelations', type: 'one-to-many' },
      { to: 'Relationship', name: 'targetRelations', type: 'one-to-many' },
    ],
  },
  Relationship: {
    columns: [
      { name: 'id', type: 'String', primaryKey: true },
      { name: 'projectId', type: 'String', foreignKey: true },
      { name: 'sourceEventId', type: 'String', foreignKey: true },
      { name: 'targetEventId', type: 'String', foreignKey: true },
      { name: 'relationType', type: 'RelationType' },
      { name: 'label', type: 'String?' },
    ],
    relations: [
      { to: 'Event', name: 'sourceEvent', type: 'many-to-one' },
      { to: 'Event', name: 'targetEvent', type: 'many-to-one' },
    ],
  },
  Evidence: {
    columns: [
      { name: 'id', type: 'String', primaryKey: true },
      { name: 'projectId', type: 'String', foreignKey: true },
      { name: 'eventId', type: 'String?', foreignKey: true },
      { name: 'title', type: 'String' },
      { name: 'evidenceType', type: 'EvidenceType' },
    ],
    relations: [
      { to: 'Project', name: 'project', type: 'many-to-one' },
      { to: 'Event', name: 'event', type: 'many-to-one' },
    ],
  },
  Note: {
    columns: [
      { name: 'id', type: 'String', primaryKey: true },
      { name: 'projectId', type: 'String', foreignKey: true },
      { name: 'eventId', type: 'String?', foreignKey: true },
      { name: 'content', type: 'String' },
      { name: 'noteType', type: 'NoteType' },
    ],
    relations: [
      { to: 'Project', name: 'project', type: 'many-to-one' },
      { to: 'Event', name: 'event', type: 'many-to-one' },
    ],
  },
  AuditLog: {
    columns: [
      { name: 'id', type: 'String', primaryKey: true },
      { name: 'userId', type: 'String?', foreignKey: true },
      { name: 'action', type: 'String' },
      { name: 'resourceType', type: 'String' },
      { name: 'createdAt', type: 'DateTime' },
    ],
    relations: [
      { to: 'User', name: 'user', type: 'many-to-one' },
    ],
  },
};

// Generate nodes from schema
function generateNodes(): Node[] {
  const nodePositions = [
    { x: 0, y: 0 },
    { x: 300, y: 0 },
    { x: 600, y: 0 },
    { x: 150, y: 300 },
    { x: 450, y: 300 },
    { x: 0, y: 600 },
    { x: 300, y: 600 },
  ];

  return Object.keys(schemaData).map((tableName, index) => ({
    id: tableName,
    type: 'tableNode',
    position: nodePositions[index] || { x: (index % 4) * 300, y: Math.floor(index / 4) * 300 },
    data: {
      label: tableName,
      columns: schemaData[tableName as keyof typeof schemaData].columns,
    },
  }));
}

// Generate edges from relations
function generateEdges(): Edge[] {
  const edges: Edge[] = [];
  const addedEdges = new Set<string>();

  Object.entries(schemaData).forEach(([tableName, data]) => {
    data.relations.forEach((rel) => {
      const edgeId = `${tableName}-${rel.to}`;
      const reverseId = `${rel.to}-${tableName}`;

      if (!addedEdges.has(edgeId) && !addedEdges.has(reverseId)) {
        edges.push({
          id: edgeId,
          source: tableName,
          target: rel.to,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
          label: rel.type,
          labelStyle: { fontSize: 10 },
          labelBgStyle: { fill: '#f8fafc' },
        });
        addedEdges.add(edgeId);
      }
    });
  });

  return edges;
}

// Custom Table Node Component
function TableNode({ data }: { data: { label: string; columns: Array<{ name: string; type: string; primaryKey?: boolean; foreignKey?: boolean }> } }) {
  return (
    <Card className="min-w-[200px] shadow-lg">
      <CardHeader className="p-3 bg-primary/10 border-b">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Table className="h-4 w-4" />
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.columns.map((col, index) => (
          <div
            key={col.name}
            className={cn(
              'flex items-center justify-between px-3 py-1.5 text-xs border-b last:border-b-0',
              index % 2 === 0 ? 'bg-muted/30' : ''
            )}
          >
            <div className="flex items-center gap-2">
              {col.primaryKey && (
                <Badge variant="outline" className="h-4 px-1 text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200">
                  PK
                </Badge>
              )}
              {col.foreignKey && (
                <Badge variant="outline" className="h-4 px-1 text-[10px] bg-blue-100 text-blue-700 border-blue-200">
                  FK
                </Badge>
              )}
              <span className="font-medium">{col.name}</span>
            </div>
            <span className="text-muted-foreground font-mono text-[10px]">{col.type}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const nodeTypes = {
  tableNode: TableNode,
};

export function SchemaVisualizer() {
  const [nodes, setNodes, onNodesChange] = useNodesState(generateNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(generateEdges());
  const { tables, fetchTables } = useDatabaseStore();

  React.useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleReset = () => {
    setNodes(generateNodes());
    setEdges(generateEdges());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset Layout
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Table className="h-4 w-4" />
          {Object.keys(schemaData).length} tables
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls position="bottom-right" />
          <MiniMap
            nodeColor="#3b82f6"
            maskColor="rgba(0, 0, 0, 0.1)"
            position="top-right"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
