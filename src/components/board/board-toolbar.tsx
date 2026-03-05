'use client';

import { useCallback, useState } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Search,
  Filter,
  Map,
  Grid3X3,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useProjectStore, EventType, EventStatus } from '@/stores/project-store';

interface BoardToolbarProps {
  onAddEvent: () => void;
}

const EVENT_TYPES: { value: EventType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'GENERAL', label: 'General' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'EVIDENCE', label: 'Evidence' },
  { value: 'SUSPECT', label: 'Suspect' },
  { value: 'WITNESS', label: 'Witness' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'TIMELINE', label: 'Timeline' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'CUSTOM', label: 'Custom' },
];

const EVENT_STATUSES: { value: EventStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function BoardToolbar({ onAddEvent }: BoardToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  const {
    boardSettings,
    setBoardSettings,
    filterState,
    setFilterState,
    events,
  } = useProjectStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Active filter count
  const activeFilterCount = [
    filterState.eventType !== 'ALL' ? 1 : 0,
    filterState.status !== 'ALL' ? 1 : 0,
    filterState.searchQuery ? 1 : 0,
    filterState.dateRange.from ? 1 : 0,
    filterState.dateRange.to ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setFilterState({ searchQuery: value });
    },
    [setFilterState]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterState({
      eventType: 'ALL',
      status: 'ALL',
      searchQuery: '',
      dateRange: {},
    });
  }, [setFilterState]);

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[60px] text-center text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Fit view */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFitView}
        title="Fit to View"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Add event */}
      <Button variant="default" size="sm" onClick={onAddEvent}>
        <Plus className="mr-1 h-4 w-4" />
        Add Event
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Search */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(filterState.searchQuery && 'text-primary')}
          >
            <Search className="mr-1 h-4 w-4" />
            Search
            {filterState.searchQuery && (
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Search Events</Label>
              {filterState.searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setFilterState({ searchQuery: '' })}
                >
                  Clear
                </Button>
              )}
            </div>
            <Input
              placeholder="Search by title, description, location..."
              value={filterState.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-8"
            />
            {filterState.searchQuery && (
              <div className="text-xs text-muted-foreground">
                Found{' '}
                {
                  events.filter((e) =>
                    e.title.toLowerCase().includes(filterState.searchQuery.toLowerCase())
                  ).length
                }{' '}
                events
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Filter */}
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(activeFilterCount > 0 && 'text-primary')}
          >
            <Filter className="mr-1 h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Filters</Label>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Event Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Event Type</Label>
              <Select
                value={filterState.eventType}
                onValueChange={(value) =>
                  setFilterState({ eventType: value as EventType | 'ALL' })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={filterState.status}
                onValueChange={(value) =>
                  setFilterState({ status: value as EventStatus | 'ALL' })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1">
                {filterState.eventType !== 'ALL' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {filterState.eventType}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => setFilterState({ eventType: 'ALL' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filterState.status !== 'ALL' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {filterState.status}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => setFilterState({ status: 'ALL' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Settings dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Board Settings">
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setBoardSettings({ showMinimap: !boardSettings.showMinimap })}
          >
            <Map className="mr-2 h-4 w-4" />
            Minimap
            {boardSettings.showMinimap && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="p-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Snap to Grid</Label>
              <Switch
                checked={boardSettings.snapToGrid}
                onCheckedChange={(checked) =>
                  setBoardSettings({ snapToGrid: checked })
                }
              />
            </div>
          </div>
          <div className="p-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Labels</Label>
              <Switch
                checked={boardSettings.showLabels}
                onCheckedChange={(checked) =>
                  setBoardSettings({ showLabels: checked })
                }
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Helper function (imported from lib/utils if needed)
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
