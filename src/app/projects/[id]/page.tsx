'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/project-store';
import { useAuthStore } from '@/stores/auth-store';
import { InvestigationBoard } from '@/components/board/investigation-board';
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
  Settings,
  Users,
  FileText,
  Link2,
  MoreVertical,
  Edit,
  Archive,
  Trash2,
  Share2,
  Plus,
  Calendar,
  MapPin,
  Tag,
  Clock,
  Activity,
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

// Project priority colors
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-500',
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
  } = useProjectStore();
  
  const [activeTab, setActiveTab] = useState('board');
  const [showSidePanel, setShowSidePanel] = useState(true);

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

  // Project stats
  const stats = {
    totalEvents: events.length,
    totalConnections: relationships.length,
    verifiedEvents: events.filter(e => e.verified).length,
    lockedEvents: events.filter(e => e.isLocked).length,
  };

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
          <ResizablePanel defaultSize={showSidePanel ? 75 : 100} minSize={50}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="board" className="text-sm">Board</TabsTrigger>
                  <TabsTrigger value="timeline" className="text-sm">Timeline</TabsTrigger>
                  <TabsTrigger value="evidence" className="text-sm">Evidence</TabsTrigger>
                  <TabsTrigger value="notes" className="text-sm">Notes</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="board" className="flex-1 m-0">
                <InvestigationBoard projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="timeline" className="flex-1 m-0 overflow-auto p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Timeline View</h3>
                  <p className="text-muted-foreground">Timeline visualization coming soon...</p>
                  {/* TODO: Timeline view */}
                </div>
              </TabsContent>
              
              <TabsContent value="evidence" className="flex-1 m-0 overflow-auto p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Evidence</h3>
                  <p className="text-muted-foreground">Evidence management coming soon...</p>
                  {/* TODO: Evidence management */}
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="flex-1 m-0 overflow-auto p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Notes</h3>
                  <p className="text-muted-foreground">Notes management coming soon...</p>
                  {/* TODO: Notes management */}
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          {/* Side panel */}
          {showSidePanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <ScrollArea className="h-full">
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

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Link2 className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
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

                    {/* Event Types Summary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Event Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(
                            events.reduce((acc, e) => {
                              acc[e.eventType] = (acc[e.eventType] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{type}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {events.slice(0, 5).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-2 text-sm py-1 border-b last:border-0"
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: event.color || '#6b7280'
                                }}
                              />
                              <span className="truncate flex-1">{event.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
