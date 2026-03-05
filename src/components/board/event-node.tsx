'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Event type icons and colors
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

// Status badges
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  NEW: { label: 'New', variant: 'default' },
  INVESTIGATING: { label: 'Investigating', variant: 'secondary' },
  VERIFIED: { label: 'Verified', variant: 'default' },
  DISPUTED: { label: 'Disputed', variant: 'destructive' },
  DISMISSED: { label: 'Dismissed', variant: 'outline' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
};

interface EventNodeData {
  id: string;
  title: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  eventType: string;
  status: string;
  confidence: number;
  importance: number;
  verified: boolean;
  isLocked: boolean;
  color?: string;
  isSelected?: boolean;
  isConnecting?: boolean;
}

function EventNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as EventNodeData;
  const [isHovered, setIsHovered] = useState(false);
  
  const typeConfig = EVENT_TYPE_CONFIG[nodeData.eventType] || EVENT_TYPE_CONFIG.GENERAL;
  const statusConfig = STATUS_CONFIG[nodeData.status] || STATUS_CONFIG.NEW;
  const TypeIcon = typeConfig.icon;

  const borderColor = nodeData.color || typeConfig.color;
  
  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative group',
          nodeData.isConnecting && 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Connection handles */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
        />

        {/* Main card */}
        <Card
          className={cn(
            'min-w-[240px] max-w-[320px] transition-all duration-200 shadow-md hover:shadow-lg',
            selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            nodeData.isLocked && 'opacity-75'
          )}
          style={{
            borderLeftWidth: '4px',
            borderLeftColor: borderColor,
          }}
        >
          <CardHeader className="p-3 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: borderColor + '20' }}
                >
                  <TypeIcon className="h-4 w-4" style={{ color: borderColor }} />
                </div>
                <CardTitle className="text-sm font-semibold truncate">
                  {nodeData.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {nodeData.isLocked && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Locked</TooltipContent>
                  </Tooltip>
                )}
                {nodeData.verified && (
                  <Tooltip>
                    <TooltipTrigger>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>Verified</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-3 pt-0 space-y-2">
            {/* Description */}
            {nodeData.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {nodeData.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {nodeData.eventDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(nodeData.eventDate).toLocaleDateString()}
                    {nodeData.eventTime && ` ${nodeData.eventTime}`}
                  </span>
                </div>
              )}
              {nodeData.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{nodeData.location}</span>
                </div>
              )}
            </div>

            {/* Status and confidence */}
            <div className="flex items-center justify-between">
              <Badge variant={statusConfig.variant} className="text-[10px]">
                {statusConfig.label}
              </Badge>
              <div className="flex items-center gap-2 text-[10px]">
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Conf:</span>
                      <span
                        className={cn(
                          'font-medium',
                          nodeData.confidence >= 70
                            ? 'text-green-500'
                            : nodeData.confidence >= 40
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        )}
                      >
                        {nodeData.confidence}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Confidence Level</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${nodeData.confidence}%`,
                  backgroundColor: borderColor,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Hover actions */}
        {isHovered && !nodeData.isLocked && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border rounded-lg shadow-lg p-1 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Edit className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Link2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Connect</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export const EventNode = memo(EventNodeComponent);
