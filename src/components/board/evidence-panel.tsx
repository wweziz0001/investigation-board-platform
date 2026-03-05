'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Image,
  Video,
  AudioWaveform,
  Mail,
  MessageSquare,
  DollarSign,
  MapPin,
  Package,
  Globe,
  Database,
  HelpCircle,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  Link2,
  Shield,
  Lock,
  Calendar,
  FileIcon,
  ExternalLink,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { EvidenceDialog } from './evidence-dialog';
import { toast } from 'sonner';

// Evidence type configuration
const EVIDENCE_TYPES = [
  { value: 'DOCUMENT', label: 'Document', icon: FileText, color: '#6366f1' },
  { value: 'IMAGE', label: 'Image', icon: Image, color: '#22c55e' },
  { value: 'VIDEO', label: 'Video', icon: Video, color: '#ef4444' },
  { value: 'AUDIO', label: 'Audio', icon: AudioWaveform, color: '#f97316' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: '#3b82f6' },
  { value: 'MESSAGE', label: 'Message', icon: MessageSquare, color: '#8b5cf6' },
  { value: 'FINANCIAL', label: 'Financial', icon: DollarSign, color: '#eab308' },
  { value: 'LOCATION', label: 'Location', icon: MapPin, color: '#14b8a6' },
  { value: 'PHYSICAL', label: 'Physical', icon: Package, color: '#ec4899' },
  { value: 'WEB', label: 'Web', icon: Globe, color: '#06b6d4' },
  { value: 'DATABASE', label: 'Database', icon: Database, color: '#84cc16' },
  { value: 'OTHER', label: 'Other', icon: HelpCircle, color: '#6b7280' },
];

// Evidence type colors for badges
const EVIDENCE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  DOCUMENT: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  IMAGE: { bg: 'bg-green-100', text: 'text-green-800' },
  VIDEO: { bg: 'bg-red-100', text: 'text-red-800' },
  AUDIO: { bg: 'bg-orange-100', text: 'text-orange-800' },
  EMAIL: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MESSAGE: { bg: 'bg-purple-100', text: 'text-purple-800' },
  FINANCIAL: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  LOCATION: { bg: 'bg-teal-100', text: 'text-teal-800' },
  PHYSICAL: { bg: 'bg-pink-100', text: 'text-pink-800' },
  WEB: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  DATABASE: { bg: 'bg-lime-100', text: 'text-lime-800' },
  OTHER: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// Evidence interface
interface Evidence {
  id: string;
  projectId: string;
  eventId?: string | null;
  title: string;
  description?: string | null;
  evidenceType: string;
  fileName?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  externalUrl?: string | null;
  externalSource?: string | null;
  collectedDate?: string | null;
  collectedBy?: string | null;
  isVerified: boolean;
  isConfidential: boolean;
  accessLevel: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  };
  event?: {
    id: string;
    title: string;
    eventType: string;
  } | null;
  _count?: {
    notes: number;
  };
}

// Event interface for linking
interface Event {
  id: string;
  title: string;
  eventType: string;
  eventDate?: string | null;
}

interface EvidencePanelProps {
  projectId: string;
  eventId?: string;
  events?: Event[];
  onEvidenceSelect?: (evidenceId: string) => void;
  onEvidenceLink?: (evidenceId: string, eventId: string) => Promise<void>;
  className?: string;
}

export function EvidencePanel({
  projectId,
  eventId,
  events = [],
  onEvidenceSelect,
  onEvidenceLink,
  className = '',
}: EvidencePanelProps) {
  // State
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState<Evidence | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch evidence
  const fetchEvidence = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        ...(eventId && { eventId }),
        ...(typeFilter !== 'all' && { evidenceType: typeFilter }),
        ...(verifiedFilter !== 'all' && { isVerified: verifiedFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/evidence?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch evidence');
      }

      const data = await response.json();
      setEvidence(data.data || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast.error('Failed to load evidence');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [projectId, eventId, typeFilter, verifiedFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        fetchEvidence();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter evidence client-side for additional filtering
  const filteredEvidence = useMemo(() => {
    return evidence.filter((item) => {
      if (searchQuery && searchQuery.length < 2) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [evidence, searchQuery]);

  // Get evidence type info
  const getEvidenceTypeInfo = (type: string) => {
    return EVIDENCE_TYPES.find((t) => t.value === type) || EVIDENCE_TYPES[11]; // OTHER
  };

  // Format file size
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Handle create/edit
  const handleCreate = () => {
    setSelectedEvidence(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: Evidence) => {
    setSelectedEvidence(item);
    setDialogOpen(true);
  };

  // Handle delete
  const handleDeleteClick = (item: Evidence) => {
    setEvidenceToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!evidenceToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/evidence/${evidenceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete evidence');
      }

      toast.success('Evidence deleted successfully');
      setEvidence((prev) => prev.filter((e) => e.id !== evidenceToDelete.id));
      setDeleteDialogOpen(false);
      setEvidenceToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete evidence');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle download
  const handleDownload = (item: Evidence) => {
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank');
    } else if (item.filePath) {
      // In a real app, this would trigger a file download
      toast.info('File download started');
    } else {
      toast.info('No file available for download');
    }
  };

  // Handle view
  const handleView = (item: Evidence) => {
    if (onEvidenceSelect) {
      onEvidenceSelect(item.id);
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank');
    }
  };

  // Handle submit (create/update)
  const handleSubmit = async (data: Partial<Evidence>) => {
    try {
      const isEdit = !!selectedEvidence;
      const url = isEdit ? `/api/evidence/${selectedEvidence.id}` : '/api/evidence';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...data,
          projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save evidence');
      }

      const result = await response.json();
      toast.success(isEdit ? 'Evidence updated successfully' : 'Evidence created successfully');
      
      if (isEdit) {
        setEvidence((prev) =>
          prev.map((e) => (e.id === result.data.id ? result.data : e))
        );
      } else {
        setEvidence((prev) => [result.data, ...prev]);
      }

      setDialogOpen(false);
      setSelectedEvidence(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save evidence');
      throw error;
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setVerifiedFilter('all');
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || verifiedFilter !== 'all';

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Evidence</CardTitle>
            <CardDescription>
              {filteredEvidence.length} item{filteredEvidence.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Evidence
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-muted' : ''}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EVIDENCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Verified</SelectItem>
                  <SelectItem value="false">Unverified</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full max-h-[600px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No evidence found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Add evidence to get started'}
              </p>
              {!hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Evidence
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredEvidence.map((item) => {
                const typeInfo = getEvidenceTypeInfo(item.evidenceType);
                const typeColor = EVIDENCE_TYPE_COLORS[item.evidenceType] || EVIDENCE_TYPE_COLORS.OTHER;
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${typeInfo.color}20` }}
                      >
                        <TypeIcon className="h-5 w-5" style={{ color: typeInfo.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium truncate">{item.title}</h4>
                              {item.isVerified && (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {item.isConfidential && (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Confidential
                                </Badge>
                              )}
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(item)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {onEvidenceLink && events.length > 0 && !item.eventId && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Show event selection dialog
                                    toast.info('Event linking coming soon');
                                  }}
                                >
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Link to Event
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(item)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <Badge className={`${typeColor.bg} ${typeColor.text}`}>
                            {typeInfo.label}
                          </Badge>
                          
                          {item.fileName && (
                            <span className="flex items-center gap-1">
                              <FileIcon className="h-3 w-3" />
                              {item.fileName}
                            </span>
                          )}
                          
                          {item.fileSize && (
                            <span>{formatFileSize(item.fileSize)}</span>
                          )}
                          
                          {item.externalUrl && (
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {item.externalSource || 'External Link'}
                            </a>
                          )}
                          
                          {item.collectedDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(item.collectedDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          
                          {item.event && (
                            <span className="flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {item.event.title}
                            </span>
                          )}
                        </div>

                        {/* Collected By */}
                        {item.collectedBy && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Collected by: {item.collectedBy}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Create/Edit Dialog */}
      <EvidenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        evidence={selectedEvidence}
        projectId={projectId}
        events={events}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{evidenceToDelete?.title}"? This action cannot be undone
              and will also delete any associated notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
