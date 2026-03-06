'use client';

import { memo, useState } from 'react';
import { 
  EdgeProps, 
  getBezierPath, 
  getSmoothStepPath,
  EdgeLabelRenderer 
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

// Relationship type labels
const RELATIONSHIP_LABELS: Record<string, string> = {
  RELATED: 'Related',
  EVIDENCE: 'Evidence',
  TIMELINE: 'Timeline',
  CAUSAL: 'Causal',
  SUSPECT: 'Suspect',
  WITNESS: 'Witness',
  LOCATION: 'Location',
  COMMUNICATION: 'Communication',
  FINANCIAL: 'Financial',
  FAMILY: 'Family',
  ASSOCIATE: 'Associate',
  VEHICLE: 'Vehicle',
  ORGANIZATION: 'Organization',
  CUSTOM: 'Custom',
};

interface RelationshipEdgeData {
  id: string;
  relationType: string;
  label?: string;
  description?: string;
  strength: number;
  confidence: number;
  color?: string;
  lineStyle?: string;
  lineWidth?: number;
  isAnimated?: boolean;
  isCurved?: boolean;
  onDelete?: () => void;
}

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as unknown as RelationshipEdgeData;
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if curved or step - default to curved (true)
  const isCurved = edgeData?.isCurved !== false;
  
  // Get the appropriate path based on isCurved
  let edgePath: string;
  let labelX: number;
  let labelY: number;
  
  if (isCurved) {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    // Use SmoothStep path for non-curved edges (90-degree bends)
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    });
  }

  const color = edgeData?.color || '#6b7280';
  const label = edgeData?.label || RELATIONSHIP_LABELS[edgeData?.relationType] || 'Related';
  const strength = edgeData?.strength || 50;
  const strokeWidth = (style.strokeWidth as number) || 2;

  return (
    <>
      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        style={{
          stroke: color,
          strokeWidth: strokeWidth,
          fill: 'none',
          filter: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        className={cn(
          'transition-colors duration-200',
          selected && 'stroke-[3px]'
        )}
        markerEnd={markerEnd}
      />

      {/* Edge label and delete button */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            borderColor: color,
            color: color,
          }}
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200',
            'bg-background border flex items-center gap-1',
            selected && 'ring-1 ring-offset-1'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span>{label}</span>
          {edgeData?.strength !== undefined && (
            <span className="opacity-60">
              ({strength}%)
            </span>
          )}
          {isHovered && edgeData?.onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
              onClick={(e) => {
                e.stopPropagation();
                edgeData.onDelete?.();
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
