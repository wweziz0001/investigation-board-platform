'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  MapPin,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  Clock3,
  Layers,
  MoveHorizontal,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Event type icons and colors configuration
const EVENT_TYPE_CONFIG: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  GENERAL: { icon: FileText, label: 'General', color: '#6b7280' },
  INCIDENT: { icon: AlertCircle, label: 'Incident', color: '#ef4444' },
  EVIDENCE: { icon: FileText, label: 'Evidence', color: '#22c55e' },
  SUSPECT: { icon: User, label: 'Suspect', color: '#f97316' },
  WITNESS: { icon: User, label: 'Witness', color: '#3b82f6' },
  LOCATION: { icon: MapPin, label: 'Location', color: '#14b8a6' },
  TIMELINE: { icon: Clock, label: 'Timeline', color: '#8b5cf6' },
  DOCUMENT: { icon: FileText, label: 'Document', color: '#ec4899' },
  COMMUNICATION: { icon: User, label: 'Communication', color: '#06b6d4' },
  FINANCIAL: { icon: FileText, label: 'Financial', color: '#eab308' },
  TRAVEL: { icon: MapPin, label: 'Travel', color: '#84cc16' },
  MEETING: { icon: User, label: 'Meeting', color: '#f43f5e' },
  CUSTOM: { icon: FileText, label: 'Custom', color: '#a855f7' },
};

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  NEW: { label: 'New', variant: 'default' },
  INVESTIGATING: { label: 'Investigating', variant: 'secondary' },
  VERIFIED: { label: 'Verified', variant: 'default' },
  DISPUTED: { label: 'Disputed', variant: 'destructive' },
  DISMISSED: { label: 'Dismissed', variant: 'outline' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
};

// Zoom levels configuration
const ZOOM_LEVELS = {
  day: { label: 'Day', daysVisible: 7, unitWidth: 80 },
  week: { label: 'Week', daysVisible: 28, unitWidth: 60 },
  month: { label: 'Month', daysVisible: 90, unitWidth: 40 },
};

// Event interface based on Prisma schema
interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  eventDate?: Date | string | null;
  eventTime?: string | null;
  eventType: string;
  status: string;
  confidence: number;
  importance: number;
  verified: boolean;
  positionX: number;
  positionY: number;
  color?: string | null;
  location?: string | null;
}

interface TimelineViewProps {
  events: TimelineEvent[];
  onEventClick: (eventId: string) => void;
  selectedEventIds: string[];
  className?: string;
}

// Helper function to parse date
const parseEventDate = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format date for time axis
const formatAxisDate = (date: Date, zoomLevel: keyof typeof ZOOM_LEVELS): string => {
  if (zoomLevel === 'day') {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } else if (zoomLevel === 'week') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export function TimelineView({
  events,
  onEventClick,
  selectedEventIds,
  className,
}: TimelineViewProps) {
  // State
  const [zoomLevel, setZoomLevel] = useState<keyof typeof ZOOM_LEVELS>('week');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  // Filter events with dates
  const eventsWithDates = useMemo(() => {
    return events
      .map(event => ({
        ...event,
        parsedDate: parseEventDate(event.eventDate),
      }))
      .filter(event => event.parsedDate !== null) as (TimelineEvent & { parsedDate: Date })[];
  }, [events]);

  // Calculate date range from events
  const eventDateRange = useMemo(() => {
    if (eventsWithDates.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }
    
    const dates = eventsWithDates.map(e => e.parsedDate.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    return { start: minDate, end: maxDate };
  }, [eventsWithDates]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let filtered = eventsWithDates;
    
    // Filter by type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(e => selectedTypes.includes(e.eventType));
    }
    
    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(e => e.parsedDate >= dateRange.start!);
    }
    if (dateRange.end) {
      filtered = filtered.filter(e => e.parsedDate <= dateRange.end!);
    }
    
    // Sort by date
    return filtered.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [eventsWithDates, selectedTypes, dateRange]);

  // Calculate visible range based on scroll and zoom
  const visibleRange = useMemo(() => {
    const config = ZOOM_LEVELS[zoomLevel];
    const totalDays = Math.ceil((eventDateRange.end.getTime() - eventDateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const totalWidth = totalDays * config.unitWidth;
    const visibleDays = config.daysVisible;
    const visibleWidth = visibleDays * config.unitWidth;
    
    return {
      totalDays,
      totalWidth,
      visibleDays,
      visibleWidth,
      unitWidth: config.unitWidth,
    };
  }, [zoomLevel, eventDateRange]);

  // Generate time axis ticks
  const timeAxisTicks = useMemo(() => {
    const ticks: Date[] = [];
    const { start, end } = eventDateRange;
    const current = new Date(start);
    
    let increment = 1; // days
    if (zoomLevel === 'week') increment = 3;
    if (zoomLevel === 'month') increment = 7;
    
    while (current <= end) {
      ticks.push(new Date(current));
      current.setDate(current.getDate() + increment);
    }
    
    return ticks;
  }, [eventDateRange, zoomLevel]);

  // Calculate event position on timeline
  const getEventPosition = useCallback((event: TimelineEvent & { parsedDate: Date }) => {
    const { start } = eventDateRange;
    const daysDiff = (event.parsedDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff * visibleRange.unitWidth;
  }, [eventDateRange, visibleRange.unitWidth]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(e.currentTarget.scrollLeft);
  }, []);

  // Handle drag to scroll
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (timelineRef.current) {
      setIsDragging(true);
      setDragStart(e.clientX - timelineRef.current.scrollLeft);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && timelineRef.current) {
      timelineRef.current.scrollLeft = e.clientX - dragStart;
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Navigate timeline
  const navigateTimeline = useCallback((direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = visibleRange.visibleWidth * 0.5;
      timelineRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, [visibleRange.visibleWidth]);

  // Toggle event type filter
  const toggleTypeFilter = useCallback((type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Resize observer
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setTimelineWidth(entries[0].contentRect.width);
      }
    });
    
    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Group events by position to avoid overlap
  const eventRows = useMemo(() => {
    const rows: (TimelineEvent & { parsedDate: Date })[][] = [];
    
    filteredEvents.forEach(event => {
      const eventPos = getEventPosition(event);
      let placed = false;
      
      for (const row of rows) {
        const lastInRow = row[row.length - 1];
        const lastPos = getEventPosition(lastInRow);
        
        // Check if there's enough space (at least 100px between events)
        if (eventPos - lastPos > 100) {
          row.push(event);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        rows.push([event]);
      }
    });
    
    return rows;
  }, [filteredEvents, getEventPosition]);

  return (
    <TooltipProvider>
      <Card className={cn('flex flex-col h-full', className)}>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Timeline Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filteredEvents.length} events
              </Badge>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigateTimeline('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomLevel(prev => {
                  const levels: (keyof typeof ZOOM_LEVELS)[] = ['day', 'week', 'month'];
                  const idx = levels.indexOf(prev);
                  return idx > 0 ? levels[idx - 1] : prev;
                })}
                disabled={zoomLevel === 'day'}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Select value={zoomLevel} onValueChange={(v) => setZoomLevel(v as keyof typeof ZOOM_LEVELS)}>
                <SelectTrigger className="h-7 w-24 text-xs border-0 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day View</SelectItem>
                  <SelectItem value="week">Week View</SelectItem>
                  <SelectItem value="month">Month View</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomLevel(prev => {
                  const levels: (keyof typeof ZOOM_LEVELS)[] = ['day', 'week', 'month'];
                  const idx = levels.indexOf(prev);
                  return idx < levels.length - 1 ? levels[idx + 1] : prev;
                })}
                disabled={zoomLevel === 'month'}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigateTimeline('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Type Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <Filter className="h-3 w-3" />
                  Filter
                  {selectedTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {selectedTypes.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Filter by Event Type</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
                      <Button
                        key={type}
                        variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 justify-start text-xs"
                        onClick={() => toggleTypeFilter(type)}
                        style={{
                          borderColor: selectedTypes.includes(type) ? config.color : undefined,
                          backgroundColor: selectedTypes.includes(type) ? config.color + '20' : undefined,
                        }}
                      >
                        <config.icon 
                          className="h-3 w-3 mr-1" 
                          style={{ color: config.color }} 
                        />
                        {config.label}
                      </Button>
                    ))}
                  </div>
                  {selectedTypes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setSelectedTypes([])}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <Calendar className="h-3 w-3" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Filter by Date Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">From</label>
                      <input
                        type="date"
                        className="w-full h-8 px-2 text-xs border rounded-md bg-background"
                        value={dateRange.start?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setDateRange(prev => ({ 
                          ...prev, 
                          start: e.target.value ? new Date(e.target.value) : null 
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">To</label>
                      <input
                        type="date"
                        className="w-full h-8 px-2 text-xs border rounded-md bg-background"
                        value={dateRange.end?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setDateRange(prev => ({ 
                          ...prev, 
                          end: e.target.value ? new Date(e.target.value) : null 
                        }))}
                      />
                    </div>
                  </div>
                  {(dateRange.start || dateRange.end) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setDateRange({ start: null, end: null })}
                    >
                      Clear Date Range
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Drag indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <GripVertical className="h-3 w-3" />
              Drag to pan
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <CalendarDays className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">No events with dates</p>
              <p className="text-xs mt-1">
                Add events with dates to see them on the timeline
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Main Timeline Area */}
              <ScrollArea className="flex-1">
                <div
                  ref={timelineRef}
                  className={cn(
                    'relative pb-12 min-h-[300px]',
                    isDragging && 'cursor-grabbing'
                  )}
                  style={{ width: visibleRange.totalWidth + 100 }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onScroll={handleScroll}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {timeAxisTicks.map((tick, idx) => {
                      const position = (tick.getTime() - eventDateRange.start.getTime()) / (1000 * 60 * 60 * 24) * visibleRange.unitWidth;
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-8 border-l border-border/30"
                          style={{ left: position }}
                        />
                      );
                    })}
                  </div>

                  {/* Event Rows */}
                  <div className="relative pt-4">
                    {eventRows.map((row, rowIdx) => (
                      <div
                        key={rowIdx}
                        className="absolute h-20"
                        style={{ top: rowIdx * 88 + 16 }}
                      >
                        {row.map((event) => {
                          const position = getEventPosition(event);
                          const typeConfig = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.GENERAL;
                          const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.NEW;
                          const isSelected = selectedEventIds.includes(event.id);
                          const TypeIcon = typeConfig.icon;

                          return (
                            <Tooltip key={event.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'absolute flex flex-col items-center cursor-pointer transition-all duration-200',
                                    isSelected && 'z-10'
                                  )}
                                  style={{ left: position }}
                                  onClick={() => onEventClick(event.id)}
                                >
                                  {/* Event marker */}
                                  <div
                                    className={cn(
                                      'relative flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200',
                                      'hover:shadow-lg hover:scale-105',
                                      isSelected 
                                        ? 'border-primary shadow-lg ring-2 ring-primary/30' 
                                        : 'border-transparent hover:border-border'
                                    )}
                                    style={{
                                      backgroundColor: (event.color || typeConfig.color) + '15',
                                      borderColor: isSelected ? undefined : (event.color || typeConfig.color) + '60',
                                    }}
                                  >
                                    {/* Connector line */}
                                    <div
                                      className="absolute -bottom-4 w-0.5 h-4"
                                      style={{ backgroundColor: event.color || typeConfig.color }}
                                    />
                                    
                                    {/* Icon */}
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                                      style={{ backgroundColor: (event.color || typeConfig.color) + '30' }}
                                    >
                                      <TypeIcon 
                                        className="h-4 w-4" 
                                        style={{ color: event.color || typeConfig.color }} 
                                      />
                                    </div>
                                    
                                    {/* Title */}
                                    <span className="text-xs font-medium text-center max-w-[100px] truncate">
                                      {event.title}
                                    </span>
                                    
                                    {/* Date */}
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {formatDate(event.parsedDate)}
                                    </span>
                                    
                                    {/* Indicators */}
                                    <div className="flex items-center gap-1 mt-1">
                                      {event.verified && (
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      )}
                                      {event.confidence >= 70 && (
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[280px] p-3"
                                sideOffset={8}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-6 h-6 rounded flex items-center justify-center"
                                        style={{ backgroundColor: (event.color || typeConfig.color) + '30' }}
                                      >
                                        <TypeIcon 
                                          className="h-3 w-3" 
                                          style={{ color: event.color || typeConfig.color }} 
                                        />
                                      </div>
                                      <span className="font-medium text-sm">{event.title}</span>
                                    </div>
                                  </div>
                                  
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-muted-foreground" />
                                      <span>{formatDate(event.parsedDate)}</span>
                                      {event.eventTime && (
                                        <span className="text-muted-foreground">{event.eventTime}</span>
                                      )}
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span>{event.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge variant={statusConfig.variant} className="text-[10px]">
                                      {statusConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px]">
                                      {typeConfig.label}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">Confidence:</span>
                                      <span className={cn(
                                        'font-medium',
                                        event.confidence >= 70 ? 'text-green-500' :
                                        event.confidence >= 40 ? 'text-yellow-500' : 'text-red-500'
                                      )}>
                                        {event.confidence}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">Importance:</span>
                                      <span className={cn(
                                        'font-medium',
                                        event.importance >= 70 ? 'text-red-500' :
                                        event.importance >= 40 ? 'text-yellow-500' : 'text-green-500'
                                      )}>
                                        {event.importance}%
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <p className="text-[10px] text-muted-foreground">
                                    Click to select on board
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Time Axis */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-muted/50 border-t flex items-end">
                    {timeAxisTicks.map((tick, idx) => {
                      const position = (tick.getTime() - eventDateRange.start.getTime()) / (1000 * 60 * 60 * 24) * visibleRange.unitWidth;
                      return (
                        <div
                          key={idx}
                          className="absolute text-[10px] text-muted-foreground transform -translate-x-1/2"
                          style={{ left: position, bottom: 4 }}
                        >
                          {formatAxisDate(tick, zoomLevel)}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Legend */}
              <div className="border-t bg-muted/30 p-3">
                <div className="flex items-center gap-4 text-xs overflow-x-auto">
                  <div className="flex items-center gap-1 shrink-0">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Legend:</span>
                  </div>
                  {Object.entries(EVENT_TYPE_CONFIG)
                    .filter(([type]) => eventsWithDates.some(e => e.eventType === type))
                    .slice(0, 6)
                    .map(([type, config]) => (
                      <div key={type} className="flex items-center gap-1 shrink-0">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span>{config.label}</span>
                      </div>
                    ))
                  }
                  <div className="flex items-center gap-1 shrink-0 ml-auto text-muted-foreground">
                    <MoveHorizontal className="h-3 w-3" />
                    Scroll or drag to navigate
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default TimelineView;
