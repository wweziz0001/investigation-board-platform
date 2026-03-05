'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { cn } from '@/lib/utils';

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
  const edgeData = data as RelationshipEdgeData;
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = edgeData?.color || '#6b7280';
  const label = edgeData?.label || RELATIONSHIP_LABELS[edgeData?.relationType] || 'Related';
  const strength = edgeData?.strength || 50;

  return (
    <>
      {/* Glow effect for selected */}
      {selected && (
        <path
          d={edgePath}
          style={{
            stroke: color,
            strokeWidth: (style.strokeWidth as number || 2) + 4,
            strokeOpacity: 0.3,
            fill: 'none',
          }}
        />
      )}
      
      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        style={{
          ...style,
          stroke: selected ? color : style.stroke as string || color,
          strokeWidth: selected ? (style.strokeWidth as number || 2) + 1 : style.strokeWidth as number || 2,
        }}
        className={cn(
          'transition-all duration-200',
          selected && 'filter drop-shadow-md',
          !selected && 'hover:stroke-[3px]'
        )}
        markerEnd={markerEnd}
      />

      {/* Edge label */}
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
            'bg-background/95 border shadow-sm backdrop-blur-sm',
            selected && 'ring-1 ring-primary shadow-md'
          )}
        >
          {label}
          {edgeData?.strength !== undefined && (
            <span className="ml-1 opacity-60">
              ({strength}%)
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
