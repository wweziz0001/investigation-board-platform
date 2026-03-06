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
  const edgeData = data as unknown as RelationshipEdgeData;
  
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
  const strokeWidth = style.strokeWidth as number || 2;

  return (
    <>
      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        style={{
          ...style,
          stroke: selected ? color : style.stroke as string || color,
          strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
        }}
        className="transition-all duration-200"
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
            ...(selected && { ringColor: color })
          }}
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200',
            'bg-background border',
            selected && 'ring-1 ring-offset-1'
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
