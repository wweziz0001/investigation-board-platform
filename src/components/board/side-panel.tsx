'use client';

import { X, Calendar, MapPin, User, Clock, Tag, FileText, Link2, Shield, AlertCircle, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore } from '@/stores/project-store';
import { format } from 'date-fns';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

// Event type colors
const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GENERAL: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  INCIDENT: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  EVIDENCE: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  SUSPECT: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  WITNESS: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  LOCATION: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  TIMELINE: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  DOCUMENT: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  COMMUNICATION: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  FINANCIAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  TRAVEL: { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
  MEETING: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  CUSTOM: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
};

// Status colors
const statusColors: Record<string, { bg: string; text: string }> = {
  NEW: { bg: 'bg-blue-100', text: 'text-blue-800' },
  INVESTIGATING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  VERIFIED: { bg: 'bg-green-100', text: 'text-green-800' },
  DISPUTED: { bg: 'bg-red-100', text: 'text-red-800' },
  DISMISSED: { bg: 'bg-gray-100', text: 'text-gray-800' },
  ARCHIVED: { bg: 'bg-slate-100', text: 'text-slate-800' },
};

export function SidePanel() {
  const { events, relationships, selectedEventIds, clearSelection } = useProjectStore();
  const isMobile = useIsMobile();
  
  // Get the selected event
  const selectedEvent = selectedEventIds.length === 1 
    ? events.find(e => e.id === selectedEventIds[0]) 
    : null;

  if (!selectedEvent) return null;

  // Get related events
  const outgoingRelations = relationships.filter(r => r.sourceEventId === selectedEvent.id);
  const incomingRelations = relationships.filter(r => r.targetEventId === selectedEvent.id);

  // Get type and status styling
  const typeStyle = EVENT_TYPE_COLORS[selectedEvent.eventType] || EVENT_TYPE_COLORS.GENERAL;
  const statusStyle = statusColors[selectedEvent.status] || statusColors.NEW;

  // Format date
  const formattedDate = selectedEvent.eventDate
    ? format(new Date(selectedEvent.eventDate), 'MMMM d, yyyy')
    : null;

  // Confidence indicator
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return { label: 'High', color: 'text-green-600' };
    if (confidence >= 50) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
  };

  const confidenceInfo = getConfidenceLabel(selectedEvent.confidence);

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className={typeStyle.bg + ' ' + typeStyle.text + ' ' + typeStyle.border}>
              {selectedEvent.eventType}
            </Badge>
            {selectedEvent.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            {selectedEvent.verified && <Shield className="h-4 w-4 text-green-600" />}
          </div>
        </div>
        <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
        <Badge variant="outline" className={statusStyle.bg + ' ' + statusStyle.text}>
          {selectedEvent.status}
        </Badge>
      </div>

      {/* Description */}
      {selectedEvent.description && (
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {selectedEvent.description}
          </p>
        </div>
      )}

      <Separator />

      {/* Meta info */}
      <div className="space-y-3">
        {formattedDate && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
            {selectedEvent.eventTime && (
              <>
                <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                <span>{selectedEvent.eventTime}</span>
              </>
            )}
          </div>
        )}

        {selectedEvent.location && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{selectedEvent.location}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Confidence
          </div>
          <div className={`text-lg font-semibold ${confidenceInfo.color}`}>
            {confidenceInfo.label}
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${selectedEvent.confidence}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedEvent.confidence}%
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Importance
          </div>
          <div className="text-lg font-semibold">
            {selectedEvent.importance >= 80 ? 'Critical' : 
             selectedEvent.importance >= 50 ? 'High' : 'Normal'}
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${selectedEvent.importance}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedEvent.importance}%
          </div>
        </div>
      </div>

      <Separator />

      {/* Tags */}
      {selectedEvent.tags && selectedEvent.tags.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedEvent.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Related Events */}
      {(outgoingRelations.length > 0 || incomingRelations.length > 0) && (
        <div className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Connections ({outgoingRelations.length + incomingRelations.length})
          </div>
          
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {outgoingRelations.map((rel) => {
                const targetEvent = events.find(e => e.id === rel.targetEventId);
                return targetEvent ? (
                  <div key={rel.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium truncate">{targetEvent.title}</span>
                    <Badge variant="outline" className="text-xs">{rel.relationType}</Badge>
                  </div>
                ) : null;
              })}
              
              {incomingRelations.map((rel) => {
                const sourceEvent = events.find(e => e.id === rel.sourceEventId);
                return sourceEvent ? (
                  <div key={rel.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">←</span>
                    <span className="font-medium truncate">{sourceEvent.title}</span>
                    <Badge variant="outline" className="text-xs">{rel.relationType}</Badge>
                  </div>
                ) : null;
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Created: {format(new Date(selectedEvent.createdAt), 'PPpp')}</div>
        <div>Updated: {format(new Date(selectedEvent.updatedAt), 'PPpp')}</div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && clearSelection()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Event Details</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-4 max-h-[70vh]">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="w-80 border-l bg-background h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Event Details</h3>
        <Button variant="ghost" size="icon" onClick={clearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        {content}
      </ScrollArea>
    </div>
  );
}
