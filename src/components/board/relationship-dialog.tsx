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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useProjectStore, RelationshipEdge as RelationshipEdgeType } from '@/stores/project-store';

// Relationship type options
const RELATIONSHIP_TYPES = [
  { value: 'RELATED', label: 'Related', color: '#6b7280' },
  { value: 'EVIDENCE', label: 'Evidence', color: '#22c55e' },
  { value: 'TIMELINE', label: 'Timeline', color: '#3b82f6' },
  { value: 'CAUSAL', label: 'Causal', color: '#ef4444' },
  { value: 'SUSPECT', label: 'Suspect', color: '#f97316' },
  { value: 'WITNESS', label: 'Witness', color: '#06b6d4' },
  { value: 'LOCATION', label: 'Location', color: '#14b8a6' },
  { value: 'COMMUNICATION', label: 'Communication', color: '#ec4899' },
  { value: 'FINANCIAL', label: 'Financial', color: '#eab308' },
  { value: 'FAMILY', label: 'Family', color: '#8b5cf6' },
  { value: 'ASSOCIATE', label: 'Associate', color: '#f43f5e' },
  { value: 'VEHICLE', label: 'Vehicle', color: '#84cc16' },
  { value: 'ORGANIZATION', label: 'Organization', color: '#a855f7' },
  { value: 'CUSTOM', label: 'Custom', color: '#64748b' },
];

// Line style options
const LINE_STYLES = [
  { value: 'SOLID', label: 'Solid' },
  { value: 'DASHED', label: 'Dashed' },
  { value: 'DOTTED', label: 'Dotted' },
];

interface RelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: RelationshipEdgeType | null;
  projectId: string;
  onSubmit: (data: Partial<RelationshipEdgeType>) => Promise<void>;
}

export function RelationshipDialog({
  open,
  onOpenChange,
  relationship,
  projectId,
  onSubmit,
}: RelationshipDialogProps) {
  const { events } = useProjectStore();
  
  const [formData, setFormData] = useState({
    sourceEventId: '',
    targetEventId: '',
    relationType: 'RELATED',
    label: '',
    description: '',
    strength: 50,
    confidence: 50,
    color: '',
    lineStyle: 'SOLID',
    lineWidth: 2,
    isAnimated: false,
    isCurved: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (relationship) {
      setFormData({
        sourceEventId: relationship.sourceEventId,
        targetEventId: relationship.targetEventId,
        relationType: relationship.relationType,
        label: relationship.label || '',
        description: relationship.description || '',
        strength: relationship.strength,
        confidence: relationship.confidence,
        color: relationship.color || '',
        lineStyle: relationship.lineStyle || 'SOLID',
        lineWidth: relationship.lineWidth || 2,
        isAnimated: relationship.isAnimated,
        isCurved: relationship.isCurved,
      });
    } else {
      setFormData({
        sourceEventId: '',
        targetEventId: '',
        relationType: 'RELATED',
        label: '',
        description: '',
        strength: 50,
        confidence: 50,
        color: '',
        lineStyle: 'SOLID',
        lineWidth: 2,
        isAnimated: false,
        isCurved: true,
      });
    }
  }, [relationship, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sourceEventId || !formData.targetEventId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        projectId,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = RELATIONSHIP_TYPES.find(t => t.value === formData.relationType);
  const sourceEvent = events.find(e => e.id === formData.sourceEventId);
  const targetEvent = events.find(e => e.id === formData.targetEventId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {relationship ? 'Edit Connection' : 'Create Connection'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Event */}
          <div className="space-y-2">
            <Label>Source Event</Label>
            <Select
              value={formData.sourceEventId}
              onValueChange={(value) => setFormData({ ...formData, sourceEventId: value })}
              disabled={!!relationship}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source event">
                  {sourceEvent?.title || 'Select source event'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {events
                  .filter(e => e.id !== formData.targetEventId)
                  .map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Event */}
          <div className="space-y-2">
            <Label>Target Event</Label>
            <Select
              value={formData.targetEventId}
              onValueChange={(value) => setFormData({ ...formData, targetEventId: value })}
              disabled={!!relationship}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target event">
                  {targetEvent?.title || 'Select target event'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {events
                  .filter(e => e.id !== formData.sourceEventId)
                  .map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <Select
              value={formData.relationType}
              onValueChange={(value) => {
                const type = RELATIONSHIP_TYPES.find(t => t.value === value);
                setFormData({ 
                  ...formData, 
                  relationType: value,
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
                {RELATIONSHIP_TYPES.map((type) => (
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

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Connection label..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Connection description..."
              rows={2}
            />
          </div>

          {/* Strength & Confidence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strength: {formData.strength}%</Label>
              <Slider
                value={[formData.strength]}
                onValueChange={([value]) => setFormData({ ...formData, strength: value })}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Confidence: {formData.confidence}%</Label>
              <Slider
                value={[formData.confidence]}
                onValueChange={([value]) => setFormData({ ...formData, confidence: value })}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Visual Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Line Style</Label>
              <Select
                value={formData.lineStyle}
                onValueChange={(value) => setFormData({ ...formData, lineStyle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Line Width: {formData.lineWidth}px</Label>
              <Slider
                value={[formData.lineWidth]}
                onValueChange={([value]) => setFormData({ ...formData, lineWidth: value })}
                min={1}
                max={6}
                step={1}
              />
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
                id="animated"
                checked={formData.isAnimated}
                onCheckedChange={(checked) => setFormData({ ...formData, isAnimated: checked })}
              />
              <Label htmlFor="animated">Animated</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="curved"
                checked={formData.isCurved}
                onCheckedChange={(checked) => setFormData({ ...formData, isCurved: checked })}
              />
              <Label htmlFor="curved">Curved</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.sourceEventId || !formData.targetEventId}
            >
              {isSubmitting ? 'Saving...' : relationship ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
