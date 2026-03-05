'use client';

import * as React from 'react';
import {
  Search,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Eye,
  Trash2,
  FolderKanban,
  Users,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  _count?: {
    members: number;
    events: number;
  };
}

const statusConfig = {
  PLANNING: { label: 'Planning', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  PAUSED: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ARCHIVED: { label: 'Archived', color: 'bg-red-100 text-red-700 border-red-200' },
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'text-gray-600' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600' },
  HIGH: { label: 'High', color: 'text-orange-600' },
  CRITICAL: { label: 'Critical', color: 'text-red-600' },
};

export default function ProjectsManagementPage() {
  const { toast } = useToast();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);

  // Fetch projects
  const fetchProjects = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/projects?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, toast]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Archive/Restore project
  const handleArchiveToggle = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !selectedProject.isArchived }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: selectedProject.isArchived
            ? 'Project restored successfully'
            : 'Project archived successfully',
        });
        setIsArchiveDialogOpen(false);
        setSelectedProject(null);
        fetchProjects();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Project deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setSelectedProject(null);
        fetchProjects();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const getCreatorInitials = (project: Project) => {
    if (project.createdBy?.firstName && project.createdBy?.lastName) {
      return `${project.createdBy.firstName[0]}${project.createdBy.lastName[0]}`.toUpperCase();
    }
    return project.createdBy?.username?.slice(0, 2).toUpperCase() || 'UN';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects Management</h1>
          <p className="text-muted-foreground">
            Manage all investigation projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {projects.filter((p) => p.status === 'ACTIVE').length} Active
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {projects.filter((p) => p.isArchived).length} Archived
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            {projects.length} project{projects.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderKanban className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No projects found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const statusConf = statusConfig[project.status];
                    const priorityConf = priorityConfig[project.priority];

                    return (
                      <TableRow key={project.id} className={cn(project.isArchived && 'opacity-60')}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              'bg-gradient-to-br from-primary/20 to-primary/10'
                            )}>
                              <FolderKanban className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {project.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('font-normal', statusConf.color)}>
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn('font-medium text-sm', priorityConf.color)}>
                            {priorityConf.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={project.createdBy?.avatar} />
                              <AvatarFallback className="text-xs">
                                {getCreatorInitials(project)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {project.createdBy?.firstName
                                ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
                                : project.createdBy?.username || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {project._count?.members || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {project._count?.events || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProject(project);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProject(project);
                                  setIsArchiveDialogOpen(true);
                                }}
                              >
                                {project.isArchived ? (
                                  <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProject(project);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Project Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>
              Project details and statistics
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={cn('font-normal', statusConfig[selectedProject.status].color)}
                  >
                    {statusConfig[selectedProject.status].label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <span className={cn('font-medium', priorityConfig[selectedProject.priority].color)}>
                    {priorityConfig[selectedProject.priority].label}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{selectedProject.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{selectedProject._count?.members || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{selectedProject._count?.events || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {Math.ceil(
                        (Date.now() - new Date(selectedProject.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Days Active</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Owner</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedProject.createdBy?.avatar} />
                    <AvatarFallback>{getCreatorInitials(selectedProject)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {selectedProject.createdBy?.firstName
                        ? `${selectedProject.createdBy.firstName} ${selectedProject.createdBy.lastName}`
                        : selectedProject.createdBy?.username || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{selectedProject.createdBy?.username}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{new Date(selectedProject.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{new Date(selectedProject.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProject?.isArchived ? 'Restore Project' : 'Archive Project'}
            </DialogTitle>
            <DialogDescription>
              {selectedProject?.isArchived
                ? 'This will restore the project and make it accessible to members again.'
                : 'This will archive the project. Members will no longer have access unless restored.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You are about to {selectedProject?.isArchived ? 'restore' : 'archive'}{' '}
              <strong>{selectedProject?.name}</strong>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchiveToggle}>
              {selectedProject?.isArchived ? 'Restore' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All events, relationships, and evidence will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                You are about to delete <strong>{selectedProject?.name}</strong>.
                This will remove all associated data.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
