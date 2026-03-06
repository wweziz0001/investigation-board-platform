'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CalendarIcon,
  Link2,
  Upload,
  ExternalLink,
  Lock,
  Shield,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Evidence type configuration
const EVIDENCE_TYPES = [
  { value: 'DOCUMENT', label: 'Document', icon: FileText, color: '#6366f1', description: 'PDF, DOC, spreadsheets, etc.' },
  { value: 'IMAGE', label: 'Image', icon: Image, color: '#22c55e', description: 'Photos, screenshots, scans' },
  { value: 'VIDEO', label: 'Video', icon: Video, color: '#ef4444', description: 'Video recordings, CCTV footage' },
  { value: 'AUDIO', label: 'Audio', icon: AudioWaveform, color: '#f97316', description: 'Audio recordings, voice notes' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: '#3b82f6', description: 'Email correspondence' },
  { value: 'MESSAGE', label: 'Message', icon: MessageSquare, color: '#8b5cf6', description: 'Chat/SMS messages' },
  { value: 'FINANCIAL', label: 'Financial', icon: DollarSign, color: '#eab308', description: 'Bank records, transactions' },
  { value: 'LOCATION', label: 'Location', icon: MapPin, color: '#14b8a6', description: 'GPS data, location records' },
  { value: 'PHYSICAL', label: 'Physical', icon: Package, color: '#ec4899', description: 'Physical evidence photos' },
  { value: 'WEB', label: 'Web', icon: Globe, color: '#06b6d4', description: 'Web pages, archives' },
  { value: 'DATABASE', label: 'Database', icon: Database, color: '#84cc16', description: 'Database exports, logs' },
  { value: 'OTHER', label: 'Other', icon: HelpCircle, color: '#6b7280', description: 'Other evidence types' },
];

// Access level options
const ACCESS_LEVELS = [
  { value: 0, label: 'Public', description: 'All project members' },
  { value: 1, label: 'Members', description: 'Members and above' },
  { value: 2, label: 'Admin', description: 'Admins and owners only' },
  { value: 3, label: 'Owner', description: 'Project owners only' },
];

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
  hash?: string | null;
  externalUrl?: string | null;
  externalSource?: string | null;
  collectedDate?: string | null;
  collectedBy?: string | null;
  chainOfCustody?: string | null;
  isVerified: boolean;
  isConfidential: boolean;
  accessLevel: number;
  createdAt: string;
  updatedAt: string;
}

// Event interface for linking
interface Event {
  id: string;
  title: string;
  eventType: string;
  eventDate?: string | null;
}

interface EvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: Evidence | null;
  projectId: string;
  events?: Event[];
  onSubmit: (data: Partial<Evidence>) => Promise<void>;
}

export function EvidenceDialog({
  open,
  onOpenChange,
  evidence,
  projectId,
  events = [],
  onSubmit,
}: EvidenceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('file');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    evidenceType: 'DOCUMENT',
    eventId: '' as string | null,
    
    // File info
    fileName: '',
    filePath: '',
    fileSize: null as number | null,
    mimeType: '',
    
    // External link
    externalUrl: '',
    externalSource: '',
    
    // Collection info
    collectedDate: undefined as Date | undefined,
    collectedBy: '',
    
    // Status
    isVerified: false,
    isConfidential: false,
    accessLevel: 0,
  });

  // Populate form when editing
  useEffect(() => {
    if (evidence) {
      setFormData({
        title: evidence.title,
        description: evidence.description || '',
        evidenceType: evidence.evidenceType,
        eventId: evidence.eventId || null,
        fileName: evidence.fileName || '',
        filePath: evidence.filePath || '',
        fileSize: evidence.fileSize ?? null,
        mimeType: evidence.mimeType || '',
        externalUrl: evidence.externalUrl || '',
        externalSource: evidence.externalSource || '',
        collectedDate: evidence.collectedDate ? new Date(evidence.collectedDate) : undefined,
        collectedBy: evidence.collectedBy || '',
        isVerified: evidence.isVerified,
        isConfidential: evidence.isConfidential,
        accessLevel: evidence.accessLevel,
      });
      
      // Set active tab based on what data exists
      if (evidence.externalUrl) {
        setActiveTab('external');
      } else {
        setActiveTab('file');
      }
    } else {
      // Reset form for new evidence
      setFormData({
        title: '',
        description: '',
        evidenceType: 'DOCUMENT',
        eventId: null,
        fileName: '',
        filePath: '',
        fileSize: null,
        mimeType: '',
        externalUrl: '',
        externalSource: '',
        collectedDate: undefined,
        collectedBy: '',
        isVerified: false,
        isConfidential: false,
        accessLevel: 0,
      });
      setActiveTab('file');
    }
  }, [evidence, open]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: Partial<Evidence> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        evidenceType: formData.evidenceType as any,
        eventId: formData.eventId || null,
        
        // File info
        fileName: formData.fileName.trim() || null,
        filePath: formData.filePath.trim() || null,
        fileSize: formData.fileSize,
        mimeType: formData.mimeType.trim() || null,
        
        // External link
        externalUrl: formData.externalUrl.trim() || null,
        externalSource: formData.externalSource.trim() || null,
        
        // Collection info
        collectedDate: formData.collectedDate?.toISOString() || null,
        collectedBy: formData.collectedBy.trim() || null,
        
        // Status
        isVerified: formData.isVerified,
        isConfidential: formData.isConfidential,
        accessLevel: formData.accessLevel,
      };

      await onSubmit(submitData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get evidence type info
  const getTypeInfo = (type: string) => {
    return EVIDENCE_TYPES.find((t) => t.value === type) || EVIDENCE_TYPES[11];
  };

  const selectedType = getTypeInfo(formData.evidenceType);
  const TypeIcon = selectedType.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {evidence ? 'Edit Evidence' : 'Add Evidence'}
          </DialogTitle>
          <DialogDescription>
            {evidence
              ? 'Update the evidence details below.'
              : 'Add new evidence to your investigation project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-2">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Evidence title..."
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this evidence..."
                  rows={3}
                />
              </div>

              {/* Evidence Type */}
              <div className="space-y-2">
                <Label>Evidence Type</Label>
                <Select
                  value={formData.evidenceType}
                  onValueChange={(value) => setFormData({ ...formData, evidenceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" style={{ color: selectedType.color }} />
                        <span>{selectedType.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: type.color }} />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* File or External Link Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <Upload className="h-4 w-4 mr-2" />
                    File Upload
                  </TabsTrigger>
                  <TabsTrigger value="external">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    External Link
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fileName">File Name</Label>
                      <Input
                        id="fileName"
                        value={formData.fileName}
                        onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                        placeholder="document.pdf"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mimeType">MIME Type</Label>
                      <Input
                        id="mimeType"
                        value={formData.mimeType}
                        onChange={(e) => setFormData({ ...formData, mimeType: e.target.value })}
                        placeholder="application/pdf"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filePath">File Path</Label>
                      <Input
                        id="filePath"
                        value={formData.filePath}
                        onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                        placeholder="/uploads/evidence/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fileSize">File Size (bytes)</Label>
                      <Input
                        id="fileSize"
                        type="number"
                        value={formData.fileSize || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fileSize: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        placeholder="1024000"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="external" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="externalUrl">External URL</Label>
                    <Input
                      id="externalUrl"
                      type="url"
                      value={formData.externalUrl}
                      onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                      placeholder="https://example.com/evidence"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="externalSource">Source</Label>
                    <Input
                      id="externalSource"
                      value={formData.externalSource}
                      onChange={(e) => setFormData({ ...formData, externalSource: e.target.value })}
                      placeholder="e.g., Google Drive, Dropbox, Court Records"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Collection Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Collection Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collection Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !formData.collectedDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.collectedDate
                            ? format(formData.collectedDate, 'PPP')
                            : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.collectedDate}
                          onSelect={(date) => setFormData({ ...formData, collectedDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collectedBy">Collected By</Label>
                    <Input
                      id="collectedBy"
                      value={formData.collectedBy}
                      onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                      placeholder="Investigator name or ID"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Link to Event */}
              {events.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Link to Event
                    </Label>
                    <Select
                      value={formData.eventId || 'none'}
                      onValueChange={(value) =>
                        setFormData({ ...formData, eventId: value === 'none' ? null : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked event</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex items-center gap-2">
                              <span>{event.title}</span>
                              {event.eventDate && (
                                <span className="text-xs text-muted-foreground">
                                  ({format(new Date(event.eventDate), 'MMM d, yyyy')})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                </>
              )}

              {/* Verification & Access */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Verification & Access</h4>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isVerified"
                      checked={formData.isVerified}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isVerified: checked })
                      }
                    />
                    <Label htmlFor="isVerified" className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-green-600" />
                      Verified
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="isConfidential"
                      checked={formData.isConfidential}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isConfidential: checked })
                      }
                    />
                    <Label htmlFor="isConfidential" className="flex items-center gap-1">
                      <Lock className="h-4 w-4 text-orange-600" />
                      Confidential
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select
                    value={formData.accessLevel.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, accessLevel: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {level.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls who can view this evidence based on their project role.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {evidence ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                evidence ? 'Update Evidence' : 'Add Evidence'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
