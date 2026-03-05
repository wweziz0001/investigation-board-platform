'use client';

import { X, Calendar, MapPin, User, Clock, Tag, FileText, Link2, Shield, AlertCircle, Lock, Unlock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore, EVENT_TYPE_COLORS, statusColors } from '@/stores/project-store';
import { format } from 'date-fns';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-mobile';

export function SidePanel() {
  const { sidePanelOpen, closeSidePanel, selectedEvent, openEventDialog, events, relationships } = useProjectStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!selectedEvent) return null;

  // Get related events
  const outgoingRelations = relationships.filter(r => r.sourceEventId === selectedEvent.id);
  const incomingRelations = relationships.filter(r => r.targetEventId === selectedEvent.id);

  // Get type and status styling
  const typeStyle = EVENT_TYPE_COLORS[selectedEvent.eventType];
  const statusStyle = statusColors[selectedEvent.status];

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
          <Button variant="ghost" size="sm" onClick={() => openEventDialog(selectedEvent)}>
            Edit
          </Button>
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

        {selectedEvent.createdBy && (
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              Created by{' '}
              {selectedEvent.createdBy.firstName || selectedEvent.createdBy.lastName
                ? `${selectedEvent.createdBy.firstName || ''} ${selectedEvent.createdBy.lastName || ''}`.trim()
                : selectedEvent.createdBy.username}
            </span>
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
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${selectedEvent.confidence}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${confidenceInfo.color}`}>
              {selectedEvent.confidence}%
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Importance</div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${selectedEvent.importance}%` }}
              />
            </div>
            <span className="text-sm font-medium">{selectedEvent.importance}%</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Source Reliability</div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${selectedEvent.reliability}%` }}
              />
            </div>
            <span className="text-sm font-medium">{selectedEvent.reliability}%</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {selectedEvent.tags && selectedEvent.tags.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedEvent.tags.map((tagItem) => (
                <Badge
                  key={tagItem.tag.id}
                  variant="outline"
                  style={{
                    borderColor: tagItem.tag.color,
                    color: tagItem.tag.color,
                  }}
                >
                  {tagItem.tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Related Events */}
      {(outgoingRelations.length > 0 || incomingRelations.length > 0) && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4" />
              Connections ({outgoingRelations.length + incomingRelations.length})
            </div>
            
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {outgoingRelations.map((rel) => {
                  const targetEvent = events.find(e => e.id === rel.targetEventId);
                  if (!targetEvent) return null;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50"
                    >
                      <span className="truncate">{selectedEvent.title}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate font-medium">{targetEvent.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {rel.relationType}
                      </Badge>
                    </div>
                  );
                })}
                
                {incomingRelations.map((rel) => {
                  const sourceEvent = events.find(e => e.id === rel.sourceEventId);
                  if (!sourceEvent) return null;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50"
                    >
                      <span className="truncate">{sourceEvent.title}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate font-medium">{selectedEvent.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {rel.relationType}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* External references */}
      {(selectedEvent.externalId || selectedEvent.source) && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ExternalLink className="h-4 w-4" />
              References
            </div>
            {selectedEvent.externalId && (
              <div className="text-sm">
                <span className="text-muted-foreground">External ID: </span>
                <span className="font-mono">{selectedEvent.externalId}</span>
              </div>
            )}
            {selectedEvent.source && (
              <div className="text-sm">
                <span className="text-muted-foreground">Source: </span>
                <span>{selectedEvent.source}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Counts */}
      {selectedEvent._count && (
        <>
          <Separator />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {selectedEvent._count.evidence} Evidence
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {selectedEvent._count.notes} Notes
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={sidePanelOpen} onOpenChange={(open) => !open && closeSidePanel()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Event Details</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-4">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Side panel
  return (
    <div
      className={cn(
        'absolute right-0 top-0 z-20 h-full w-80 border-l bg-background shadow-lg transition-transform duration-300',
        sidePanelOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Event Details</h3>
          <Button variant="ghost" size="icon" onClick={closeSidePanel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
          {content}
        </ScrollArea>
      </div>
    </div>
  );
}

// Import cn helper
import { cn } from '@/lib/utils';
