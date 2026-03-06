'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  MarkerType,
  ConnectionLineType,
  SelectionMode,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Search,
  Filter,
  Link2,
  Trash2,
  Lock,
  Unlock,
  Grid3X3,
  Map,
  Settings,
  Download,
  Upload,
  Layers,
  X,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore, EventNode as EventNodeType, RelationshipEdge as RelationshipEdgeType } from '@/stores/project-store';
import { EventNode } from './event-node';
import { RelationshipEdge } from './relationship-edge';
import { EventDialog } from './event-dialog';
import { RelationshipDialog } from './relationship-dialog';

// Node and Edge types
const nodeTypes: NodeTypes = {
  event: EventNode,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};

// Event type colors
const EVENT_TYPE_COLORS: Record<string, string> = {
  GENERAL: '#6b7280',
  INCIDENT: '#ef4444',
  EVIDENCE: '#22c55e',
  SUSPECT: '#f97316',
  WITNESS: '#3b82f6',
  LOCATION: '#14b8a6',
  TIMELINE: '#8b5cf6',
  DOCUMENT: '#ec4899',
  COMMUNICATION: '#06b6d4',
  FINANCIAL: '#eab308',
  TRAVEL: '#84cc16',
  MEETING: '#f43f5e',
  CUSTOM: '#a855f7',
};

// Relationship type colors
const RELATIONSHIP_COLORS: Record<string, string> = {
  RELATED: '#6b7280',
  EVIDENCE: '#22c55e',
  TIMELINE: '#3b82f6',
  CAUSAL: '#ef4444',
  SUSPECT: '#f97316',
  WITNESS: '#06b6d4',
  LOCATION: '#14b8a6',
  COMMUNICATION: '#ec4899',
  FINANCIAL: '#eab308',
  FAMILY: '#8b5cf6',
  ASSOCIATE: '#f43f5e',
  VEHICLE: '#84cc16',
  ORGANIZATION: '#a855f7',
  CUSTOM: '#64748b',
};

interface InvestigationBoardProps {
  projectId: string;
}

function InvestigationBoardInner({ projectId }: InvestigationBoardProps) {
  const {
    events,
    relationships,
    loadProject,
    addEvent,
    updateEvent,
    updateEventPosition,
    deleteEvent,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    selectedEventIds,
    selectEvent,
    clearSelection,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    getFilteredEvents,
    viewport,
    setViewport,
    isLoading,
    isSaving,
    error,
  } = useProjectStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventNodeType | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<RelationshipEdgeType | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { fitView, zoomIn, zoomOut, getViewport } = useReactFlow();

  // Load project data
  useEffect(() => {
    loadProject(projectId);
  }, [projectId, loadProject]);

  // Convert events to nodes
  useEffect(() => {
    const filteredEvents = getFilteredEvents().filter(Boolean);
    const flowNodes: Node[] = filteredEvents.map((event) => ({
      id: event.id,
      type: 'event',
      position: { x: event.positionX, y: event.positionY },
      data: {
        ...event,
        color: event.color || EVENT_TYPE_COLORS[event.eventType] || EVENT_TYPE_COLORS.GENERAL,
        isSelected: selectedEventIds.includes(event.id),
        isConnecting: connectingFrom === event.id,
        onEdit: () => {
          setEditingEvent(event);
          setShowEventDialog(true);
        },
        onConnect: () => {
          setConnectingFrom(event.id);
          toast.info('Select target event to connect');
        },
        onDelete: async () => {
          if (confirm(`Delete event "${event.title}"?`)) {
            await deleteEvent(event.id);
            toast.success('Event deleted');
          }
        },
      },
    }));
    setNodes(flowNodes);
  }, [events, selectedEventIds, searchQuery, filters, connectingFrom, getFilteredEvents, setNodes, deleteEvent]);

  // Handle delete relationship
  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Delete this connection?')) return;
    
    try {
      const response = await fetch(`/api/relationships/${relationshipId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        deleteRelationship(relationshipId);
        toast.success('Connection deleted');
      } else {
        toast.error(result.error || 'Failed to delete connection');
      }
    } catch {
      toast.error('Failed to delete connection');
    }
  };

  // Convert relationships to edges
  useEffect(() => {
    const flowEdges: Edge[] = relationships.filter(Boolean).map((rel) => ({
      id: rel.id,
      type: 'relationship',
      source: rel.sourceEventId,
      target: rel.targetEventId,
      data: {
        ...rel,
        color: rel.color || RELATIONSHIP_COLORS[rel.relationType] || RELATIONSHIP_COLORS.RELATED,
        onDelete: () => handleDeleteRelationship(rel.id),
      },
      style: {
        stroke: rel.color || RELATIONSHIP_COLORS[rel.relationType] || RELATIONSHIP_COLORS.RELATED,
        strokeWidth: rel.lineWidth || 2,
        strokeDasharray: rel.lineStyle === 'DASHED' ? '5,5' : rel.lineStyle === 'DOTTED' ? '2,2' : undefined,
      },
      animated: rel.isAnimated,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: rel.color || RELATIONSHIP_COLORS[rel.relationType] || RELATIONSHIP_COLORS.RELATED,
      },
    }));
    setEdges(flowEdges);
  }, [relationships, setEdges]);

  // Create relationship helper
  const createRelationship = async (sourceId: string, targetId: string) => {
    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sourceEventId: sourceId,
          targetEventId: targetId,
          relationType: 'RELATED',
        }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        addRelationship(result.data);
        toast.success('Connection created');
      } else {
        toast.error(result.error || 'Failed to create connection');
      }
    } catch {
      toast.error('Failed to create connection');
    }
  };

  // Handle node drag
  const onNodeDragStop = useCallback(
    (_: React.SyntheticEvent, node: Node) => {
      updateEventPosition(node.id, node.position.x, node.position.y);
    },
    [updateEventPosition]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.SyntheticEvent, node: Node) => {
      if (connectingFrom && connectingFrom !== node.id) {
        // Create relationship
        createRelationship(connectingFrom, node.id);
        setConnectingFrom(null);
      } else {
        selectEvent(node.id);
      }
    },
    [selectEvent, connectingFrom, createRelationship]
  );

  // Handle edge click
  const onEdgeClick = useCallback(
    (_: React.SyntheticEvent, edge: Edge) => {
      // Find and show relationship details
      const rel = relationships.find((r) => r.id === edge.id);
      if (rel) {
        setEditingRelationship(rel);
        setShowRelationshipDialog(true);
      }
    },
    [relationships]
  );

  // Handle canvas click
  const onPaneClick = useCallback(() => {
    clearSelection();
    setConnectingFrom(null);
  }, [clearSelection]);

  // Handle viewport change
  const onMoveEnd = useCallback(() => {
    const currentViewport = getViewport();
    setViewport(currentViewport);
  }, [getViewport, setViewport]);

  // Create new event
  const handleCreateEvent = async (data: Partial<EventNodeType>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          projectId,
          positionX: Math.random() * 400 - 200,
          positionY: Math.random() * 400 - 200,
        }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        addEvent(result.data);
        toast.success('Event created');
      } else {
        toast.error(result.error || 'Failed to create event');
      }
    } catch {
      toast.error('Failed to create event');
    }
  };

  // Update event
  const handleUpdateEvent = async (data: Partial<EventNodeType>) => {
    if (!editingEvent) return;
    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success && result.data) {
        updateEvent(editingEvent.id, result.data);
        toast.success('Event updated');
      } else {
        toast.error(result.error || 'Failed to update event');
      }
    } catch {
      toast.error('Failed to update event');
    }
  };

  // Handle connection (from React Flow)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        createRelationship(connection.source, connection.target);
      }
    },
    [createRelationship]
  );

  // Delete selected events
  const handleDeleteSelected = async () => {
    if (selectedEventIds.length === 0) return;
    
    if (!confirm(`Delete ${selectedEventIds.length} event(s)?`)) return;
    
    for (const id of selectedEventIds) {
      await deleteEvent(id);
    }
    clearSelection();
    toast.success('Events deleted');
  };

  // Export board as JSON
  const handleExport = () => {
    const data = {
      events,
      relationships,
      viewport,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investigation-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Board exported');
  };

  // Event types for filter
  const eventTypes = useMemo(() => {
    const types = new Set(events.filter(Boolean).map((e) => e.eventType));
    return Array.from(types);
  }, [events]);

  // Status options for filter
  const statusOptions = ['NEW', 'INVESTIGATING', 'VERIFIED', 'DISPUTED', 'DISMISSED', 'ARCHIVED'];

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => loadProject(projectId)}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultViewport={viewport}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionMode={SelectionMode.Partial}
        proOptions={{ hideAttribution: true }}
      >
        {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => (node.data as { color?: string })?.color || '#6b7280'}
            maskColor="rgba(0,0,0,0.8)"
            style={{ background: 'var(--background)' }}
          />
        )}
        <Controls showInteractive={false} />

        {/* Toolbar */}
        <Panel position="top-left" className="flex gap-2">
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur border rounded-lg p-1 shadow-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => zoomIn()}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => zoomOut()}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => fitView({ padding: 0.2 })}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1 bg-background/95 backdrop-blur border rounded-lg p-1 shadow-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingEvent(null);
                      setShowEventDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Event</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (selectedEventIds.length === 1) {
                        setConnectingFrom(selectedEventIds[0]);
                        toast.info('Select target event to connect');
                      } else {
                        toast.error('Select one event first');
                      }
                    }}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Connect Events</TooltipContent>
              </Tooltip>
              {selectedEventIds.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleDeleteSelected}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1 bg-background/95 backdrop-blur border rounded-lg p-1 shadow-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMinimap(!showMinimap)}
                    className={showMinimap ? 'bg-accent' : ''}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Minimap</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowGrid(!showGrid)}
                    className={showGrid ? 'bg-accent' : ''}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Grid</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={snapToGrid ? 'bg-accent' : ''}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Snap to Grid</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Panel>

        {/* Search and Filter */}
        <Panel position="top-center" className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-background/95 backdrop-blur"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-background/95 backdrop-blur">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filters.eventTypes.length > 0 || filters.statuses.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.eventTypes.length + filters.statuses.length}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Event Types</div>
              {eventTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.eventTypes.includes(type)}
                  onCheckedChange={(checked) => {
                    setFilters({
                      eventTypes: checked
                        ? [...filters.eventTypes, type]
                        : filters.eventTypes.filter((t) => t !== type),
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                    />
                    {type}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm font-semibold">Status</div>
              {statusOptions.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.statuses.includes(status)}
                  onCheckedChange={(checked) => {
                    setFilters({
                      statuses: checked
                        ? [...filters.statuses, status]
                        : filters.statuses.filter((s) => s !== status),
                    });
                  }}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilters({ eventTypes: [], statuses: [], dateRange: {} })}>
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={handleExport} className="bg-background/95 backdrop-blur">
            <Download className="h-4 w-4" />
          </Button>
        </Panel>

        {/* Stats Panel */}
        <Panel position="bottom-left" className="flex gap-2">
          <div className="bg-background/95 backdrop-blur border rounded-lg px-3 py-1.5 shadow-sm text-sm">
            <span className="text-muted-foreground">Events:</span>{' '}
            <span className="font-medium">{events.length}</span>
          </div>
          <div className="bg-background/95 backdrop-blur border rounded-lg px-3 py-1.5 shadow-sm text-sm">
            <span className="text-muted-foreground">Connections:</span>{' '}
            <span className="font-medium">{relationships.length}</span>
          </div>
          {selectedEventIds.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 shadow-sm text-sm">
              <span className="text-primary">Selected:</span>{' '}
              <span className="font-medium">{selectedEventIds.length}</span>
            </div>
          )}
        </Panel>

        {/* Connecting indicator */}
        {connectingFrom && (
          <Panel position="bottom-center">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Link2 className="h-4 w-4 animate-pulse" />
              <span>Select target event to connect</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConnectingFrom(null)}
                className="ml-2 h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Event Dialog */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={editingEvent}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
      />

      {/* Relationship Dialog */}
      <RelationshipDialog
        open={showRelationshipDialog}
        onOpenChange={setShowRelationshipDialog}
        relationship={editingRelationship}
        projectId={projectId}
        onSubmit={async (data) => {
          if (editingRelationship) {
            const response = await fetch(`/api/relationships/${editingRelationship.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success && result.data) {
              updateRelationship(editingRelationship.id, result.data);
              toast.success('Connection updated');
            }
          }
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg px-6 py-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              <span>Loading investigation...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function InvestigationBoard(props: InvestigationBoardProps) {
  return (
    <ReactFlowProvider>
      <InvestigationBoardInner {...props} />
    </ReactFlowProvider>
  );
}
