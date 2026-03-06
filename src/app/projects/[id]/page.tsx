'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/project-store';
import { useAuthStore } from '@/stores/auth-store';
import { useCollaboration } from '@/hooks/use-collaboration';
import { InvestigationBoard } from '@/components/board/investigation-board';
import { TimelineView } from '@/components/board/timeline-view';
import { EvidencePanel } from '@/components/board/evidence-panel';
import { AIAnalysisPanel } from '@/components/board/ai-analysis-panel';
import { CommentsPanel } from '@/components/board/comments-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Users,
  MoreVertical,
  Edit,
  Archive,
  Trash2,
  Share2,
  Calendar,
  MapPin,
  Link2,
  Activity,
  Brain,
  MessageSquare,
  Wifi,
  WifiOff,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Project status colors
const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-500',
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-yellow-500',
  COMPLETED: 'bg-purple-500',
  ARCHIVED: 'bg-gray-500',
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuthStore();
  const {
    project,
    events,
    relationships,
    loadProject,
    isLoading,
    selectedEventIds,
    selectedRelationshipIds,
    addRelationship,
  } = useProjectStore();

  // Collaboration hook
  const {
    isConnected,
    onlineUsers,
    joinProject,
    leaveProject,
    emitRelationshipCreated,
  } = useCollaboration();

  const [activeTab, setActiveTab] = useState('board');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'details' | 'comments' | 'ai'>('details');

  // Join project room for collaboration
  useEffect(() => {
    if (projectId && isConnected !== null) {
      joinProject(projectId);
      return () => leaveProject(projectId);
    }
  }, [projectId, isConnected, joinProject, leaveProject]);

  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  // Get selected event
  const selectedEvent = selectedEventIds.length === 1
    ? events.find(e => e.id === selectedEventIds[0])
    : null;

  // Get selected relationship
  const selectedRelationship = selectedRelationshipIds.length === 1
    ? relationships.find(r => r.id === selectedRelationshipIds[0])
    : null;

  // Project stats
  const stats = {
    totalEvents: events.length,
    totalConnections: relationships.length,
    verifiedEvents: events.filter(e => e.verified).length,
    lockedEvents: events.filter(e => e.isLocked).length,
    onlineUsers: onlineUsers.length,
  };

  // Handle accepting AI-suggested relationship
  const handleAcceptRelationship = useCallback(async (rel: {
    sourceEventId: string;
    targetEventId: string;
    relationType: string;
  }) => {
    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sourceEventId: rel.sourceEventId,
          targetEventId: rel.targetEventId,
          relationType: rel.relationType,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        addRelationship(data.data);
        emitRelationshipCreated(data.data);
        toast.success('Relationship created');
      } else {
        toast.error(data.error || 'Failed to create relationship');
      }
    } catch (error) {
      toast.error('Failed to create relationship');
    }
  }, [projectId, addRelationship, emitRelationshipCreated]);

  // Handle event click from timeline
  const handleEventClick = useCallback((eventId: string) => {
    setActiveTab('board');
  }, []);

  // Events with dates for timeline
  const eventsWithDates = events
    .filter(e => e.eventDate)
    .map(e => ({
      ...e,
      eventDate: new Date(e.eventDate!),
    }))
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

  if (isLoading && !project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => router.push('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold">{project.name}</h1>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    project.status === 'ACTIVE' && 'border-green-500 text-green-500',
                    project.status === 'PAUSED' && 'border-yellow-500 text-yellow-500',
                    project.status === 'COMPLETED' && 'border-purple-500 text-purple-500'
                  )}
                >
                  {project.status}
                </Badge>
                {/* Connection status indicator */}
                {isConnected ? (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                    <Wifi className="h-3 w-3 mr-1" />
                    {stats.onlineUsers} online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-gray-500 text-gray-500">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-4 mr-4 text-sm">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>{stats.totalEvents} events</span>
              </div>
              <div className="flex items-center gap-1">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span>{stats.totalConnections} connections</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidePanel(!showSidePanel)}
            >
              {showSidePanel ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Board / Content area */}
          <ResizablePanel defaultSize={showSidePanel ? 70 : 100} minSize={50}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="board" className="text-sm gap-1">
                    <Activity className="h-3 w-3" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-sm gap-1">
                    Board
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="text-sm gap-1">
                    Evidence
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-sm gap-1">
                    <Brain className="h-3 w-3" />
                    AI Analysis
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="board" className="flex-1 m-0">
                <InvestigationBoard projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="timeline" className="flex-1 m-0">
                <TimelineView
                  events={eventsWithDates}
                  onEventClick={handleEventClick}
                  selectedEventIds={selectedEventIds}
                />
              </TabsContent>
              
              <TabsContent value="evidence" className="flex-1 m-0 overflow-hidden">
                <EvidencePanel projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
                <AIAnalysisPanel
                  projectId={projectId}
                  onAcceptRelationship={handleAcceptRelationship}
                  onEventSelect={handleEventClick}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          {/* Side panel */}
          {showSidePanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <div className="h-full flex flex-col">
                  {/* Side panel tabs */}
                  <div className="border-b px-2">
                    <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as typeof rightPanelTab)}>
                      <TabsList className="h-9 w-full justify-start">
                        <TabsTrigger value="details" className="text-xs px-2">Details</TabsTrigger>
                        <TabsTrigger value="comments" className="text-xs px-2 gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Comments
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="text-xs px-2 gap-1">
                          <Brain className="h-3 w-3" />
                          AI
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Details tab content */}
                  {rightPanelTab === 'details' && (
                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-4">
                        {/* Selected Event Details */}
                        {selectedEvent ? (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{selectedEvent.title}</CardTitle>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">{selectedEvent.eventType}</Badge>
                                <Badge variant="secondary">{selectedEvent.status}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {selectedEvent.description && (
                                <p className="text-sm text-muted-foreground">
                                  {selectedEvent.description}
                                </p>
                              )}
                              
                              <div className="space-y-2 text-sm">
                                {selectedEvent.eventDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{new Date(selectedEvent.eventDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {selectedEvent.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedEvent.location}</span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Confidence</span>
                                  <span>{selectedEvent.confidence}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${selectedEvent.confidence}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Project Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-muted rounded-lg p-2 text-center">
                                  <div className="font-semibold">{stats.totalEvents}</div>
                                  <div className="text-xs text-muted-foreground">Events</div>
                                </div>
                                <div className="bg-muted rounded-lg p-2 text-center">
                                  <div className="font-semibold">{stats.totalConnections}</div>
                                  <div className="text-xs text-muted-foreground">Connections</div>
                                </div>
                                <div className="bg-muted rounded-lg p-2 text-center">
                                  <div className="font-semibold">{stats.verifiedEvents}</div>
                                  <div className="text-xs text-muted-foreground">Verified</div>
                                </div>
                                <div className="bg-muted rounded-lg p-2 text-center">
                                  <div className="font-semibold">{stats.lockedEvents}</div>
                                  <div className="text-xs text-muted-foreground">Locked</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Online Users */}
                        {onlineUsers.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Online Users ({onlineUsers.length})
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {onlineUsers.map((u) => (
                                  <div key={u.userId} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span>{u.userName}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Comments tab content */}
                  {rightPanelTab === 'comments' && (
                    <CommentsPanel
                      projectId={projectId}
                      eventId={selectedEvent?.id}
                      relationshipId={selectedRelationship?.id}
                    />
                  )}

                  {/* AI Quick Analysis tab content */}
                  {rightPanelTab === 'ai' && (
                    <AIAnalysisPanel
                      projectId={projectId}
                      onAcceptRelationship={handleAcceptRelationship}
                      onEventSelect={handleEventClick}
                    />
                  )}
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
