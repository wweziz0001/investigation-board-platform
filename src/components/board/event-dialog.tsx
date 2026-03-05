'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EventNode as EventNodeType } from '@/stores/project-store';

// Event type options
const EVENT_TYPES = [
  { value: 'GENERAL', label: 'General', color: '#6b7280' },
  { value: 'INCIDENT', label: 'Incident', color: '#ef4444' },
  { value: 'EVIDENCE', label: 'Evidence', color: '#22c55e' },
  { value: 'SUSPECT', label: 'Suspect', color: '#f97316' },
  { value: 'WITNESS', label: 'Witness', color: '#3b82f6' },
  { value: 'LOCATION', label: 'Location', color: '#14b8a6' },
  { value: 'TIMELINE', label: 'Timeline', color: '#8b5cf6' },
  { value: 'DOCUMENT', label: 'Document', color: '#ec4899' },
  { value: 'COMMUNICATION', label: 'Communication', color: '#06b6d4' },
  { value: 'FINANCIAL', label: 'Financial', color: '#eab308' },
  { value: 'TRAVEL', label: 'Travel', color: '#84cc16' },
  { value: 'MEETING', label: 'Meeting', color: '#f43f5e' },
  { value: 'CUSTOM', label: 'Custom', color: '#a855f7' },
];

// Status options
const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventNodeType | null;
  onSubmit: (data: Partial<EventNodeType>) => Promise<void>;
}

export function EventDialog({ open, onOpenChange, event, onSubmit }: EventDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: undefined as Date | undefined,
    eventTime: '',
    location: '',
    eventType: 'GENERAL',
    status: 'NEW',
    confidence: 50,
    importance: 50,
    verified: false,
    isLocked: false,
    color: '',
    externalId: '',
    source: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        eventDate: event.eventDate ? new Date(event.eventDate) : undefined,
        eventTime: event.eventTime || '',
        location: event.location || '',
        eventType: event.eventType,
        status: event.status,
        confidence: event.confidence,
        importance: event.importance,
        verified: event.verified,
        isLocked: event.isLocked,
        color: event.color || '',
        externalId: '',
        source: '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        eventDate: undefined,
        eventTime: '',
        location: '',
        eventType: 'GENERAL',
        status: 'NEW',
        confidence: 50,
        importance: 50,
        verified: false,
        isLocked: false,
        color: '',
        externalId: '',
        source: '',
      });
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        eventDate: formData.eventDate?.toISOString(),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = EVENT_TYPES.find(t => t.value === formData.eventType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title..."
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
              placeholder="Event description..."
              rows={3}
            />
          </div>

          {/* Event Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => {
                  const type = EVENT_TYPES.find(t => t.value === value);
                  setFormData({ 
                    ...formData, 
                    eventType: value,
                    color: formData.color || type?.color || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedType?.color }}
                      />
                      {selectedType?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.eventDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.eventDate ? format(formData.eventDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventDate}
                    onSelect={(date) => setFormData({ ...formData, eventDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTime">Event Time</Label>
              <Input
                id="eventTime"
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location..."
            />
          </div>

          {/* Confidence & Importance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Confidence: {formData.confidence}%</Label>
              <Slider
                value={[formData.confidence]}
                onValueChange={([value]) => setFormData({ ...formData, confidence: value })}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Importance: {formData.importance}%</Label>
              <Slider
                value={[formData.importance]}
                onValueChange={([value]) => setFormData({ ...formData, importance: value })}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Custom Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color || selectedType?.color || '#6b7280'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.color || selectedType?.color || '#6b7280'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#6b7280"
                className="flex-1"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="verified"
                checked={formData.verified}
                onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
              />
              <Label htmlFor="verified">Verified</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="locked"
                checked={formData.isLocked}
                onCheckedChange={(checked) => setFormData({ ...formData, isLocked: checked })}
              />
              <Label htmlFor="locked">Locked</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Saving...' : event ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
