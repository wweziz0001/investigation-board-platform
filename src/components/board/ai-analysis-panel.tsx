'use client';

import { useState, useCallback } from 'react';
import {
  Brain,
  Link2,
  Pattern,
  AlertTriangle,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
type AnalysisType = 'relationships' | 'patterns' | 'anomalies' | 'summary';

interface SuggestedRelationship {
  sourceEventId: string;
  sourceEventTitle: string;
  targetEventId: string;
  targetEventTitle: string;
  relationType: string;
  confidence: number;
  reasoning: string;
}

interface PatternResult {
  patternType: string;
  description: string;
  affectedEvents: string[];
  confidence: number;
  details: string;
}

interface AnomalyResult {
  anomalyType: string;
  description: string;
  eventId: string;
  eventTitle: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

interface SummaryResult {
  overview: string;
  totalEvents: number;
  totalRelationships: number;
  keyFindings: string[];
  recommendations: string[];
  timeline: {
    earliest?: string;
    latest?: string;
  };
  eventTypes: Record<string, number>;
  statusDistribution: Record<string, number>;
}

interface AnalysisResponse {
  analysisType: AnalysisType;
  projectId: string;
  timestamp: string;
  relationships?: SuggestedRelationship[];
  patterns?: PatternResult[];
  anomalies?: AnomalyResult[];
  summary?: SummaryResult;
}

interface AIAnalysisPanelProps {
  projectId: string;
  onAcceptRelationship?: (relationship: {
    sourceEventId: string;
    targetEventId: string;
    relationType: string;
  }) => Promise<void>;
  onEventSelect?: (eventId: string) => void;
}

// Analysis type configurations
const ANALYSIS_TYPES: Array<{
  type: AnalysisType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = [
  {
    type: 'relationships',
    label: 'Relationships',
    icon: <Link2 className="h-4 w-4" />,
    description: 'Detect potential connections between events',
    color: 'text-blue-500',
  },
  {
    type: 'patterns',
    label: 'Patterns',
    icon: <Pattern className="h-4 w-4" />,
    description: 'Identify recurring patterns and trends',
    color: 'text-purple-500',
  },
  {
    type: 'anomalies',
    label: 'Anomalies',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Find unusual or suspicious events',
    color: 'text-orange-500',
  },
  {
    type: 'summary',
    label: 'Summary',
    icon: <FileText className="h-4 w-4" />,
    description: 'Generate investigation overview',
    color: 'text-green-500',
  },
];

// Severity colors
const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

// Confidence indicator component
function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const getColor = (conf: number) => {
    if (conf >= 80) return 'text-green-600';
    if (conf >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLabel = (conf: number) => {
    if (conf >= 80) return 'High';
    if (conf >= 50) return 'Medium';
    return 'Low';
  };

  return (
    <div className="flex items-center gap-2">
      <Progress value={confidence} className="h-1.5 w-16" />
      <span className={cn('text-xs font-medium', getColor(confidence))}>
        {getLabel(confidence)} ({confidence}%)
      </span>
    </div>
  );
}

export function AIAnalysisPanel({
  projectId,
  onAcceptRelationship,
  onEventSelect,
}: AIAnalysisPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Map<AnalysisType, AnalysisResponse>>(
    new Map()
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<SuggestedRelationship | null>(
    null
  );

  // Run analysis
  const runAnalysis = useCallback(
    async (type: AnalysisType) => {
      setIsLoading(true);
      setActiveAnalysis(type);

      try {
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, analysisType: type }),
        });

        const result = await response.json();

        if (result.success) {
          setAnalysisResults((prev) => {
            const newMap = new Map(prev);
            newMap.set(type, result.data);
            return newMap;
          });
          toast({
            title: 'Analysis Complete',
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} analysis has been generated.`,
          });
        } else {
          toast({
            title: 'Analysis Failed',
            description: result.error || 'An error occurred during analysis.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Analysis Failed',
          description: 'Unable to connect to the analysis service.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setActiveAnalysis(null);
      }
    },
    [projectId, toast]
  );

  // Accept relationship suggestion
  const handleAcceptRelationship = async (relationship: SuggestedRelationship) => {
    if (!onAcceptRelationship) return;

    setSelectedRelationship(relationship);
    setShowConfirmDialog(true);
  };

  // Confirm relationship acceptance
  const confirmAcceptRelationship = async () => {
    if (!selectedRelationship || !onAcceptRelationship) return;

    setAcceptingId(`${selectedRelationship.sourceEventId}-${selectedRelationship.targetEventId}`);
    try {
      await onAcceptRelationship({
        sourceEventId: selectedRelationship.sourceEventId,
        targetEventId: selectedRelationship.targetEventId,
        relationType: selectedRelationship.relationType,
      });

      // Remove from suggestions
      setAnalysisResults((prev) => {
        const newMap = new Map(prev);
        const relationshipsResult = newMap.get('relationships');
        if (relationshipsResult?.relationships) {
          relationshipsResult.relationships = relationshipsResult.relationships.filter(
            (r) =>
              !(
                r.sourceEventId === selectedRelationship.sourceEventId &&
                r.targetEventId === selectedRelationship.targetEventId
              )
          );
        }
        return newMap;
      });

      toast({
        title: 'Relationship Created',
        description: 'The suggested relationship has been added to the investigation.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create the relationship.',
        variant: 'destructive',
      });
    } finally {
      setAcceptingId(null);
      setShowConfirmDialog(false);
      setSelectedRelationship(null);
    }
  };

  // Reject relationship suggestion
  const handleRejectRelationship = (relationship: SuggestedRelationship) => {
    setAnalysisResults((prev) => {
      const newMap = new Map(prev);
      const relationshipsResult = newMap.get('relationships');
      if (relationshipsResult?.relationships) {
        relationshipsResult.relationships = relationshipsResult.relationships.filter(
          (r) =>
            !(
              r.sourceEventId === relationship.sourceEventId &&
              r.targetEventId === relationship.targetEventId
            )
        );
      }
      return newMap;
    });

    toast({
      title: 'Suggestion Rejected',
      description: 'The suggested relationship has been removed.',
    });
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Render relationships results
  const renderRelationships = (data: AnalysisResponse) => {
    if (!data.relationships || data.relationships.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No relationship suggestions found.</p>
          <p className="text-sm">AI could not identify potential connections.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.relationships.map((rel, index) => (
          <Card key={`${rel.sourceEventId}-${rel.targetEventId}`} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{rel.relationType}</Badge>
                  <ConfidenceIndicator confidence={rel.confidence} />
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 p-2 rounded bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => onEventSelect?.(rel.sourceEventId)}
                  >
                    <p className="text-sm font-medium truncate">{rel.sourceEventTitle}</p>
                    <p className="text-xs text-muted-foreground">Source Event</p>
                  </div>
                  <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div
                    className="flex-1 p-2 rounded bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => onEventSelect?.(rel.targetEventId)}
                  >
                    <p className="text-sm font-medium truncate">{rel.targetEventTitle}</p>
                    <p className="text-xs text-muted-foreground">Target Event</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{rel.reasoning}</p>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRelationship(rel)}
                    disabled={acceptingId === `${rel.sourceEventId}-${rel.targetEventId}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRelationship(rel)}
                    disabled={acceptingId === `${rel.sourceEventId}-${rel.targetEventId}`}
                  >
                    {acceptingId === `${rel.sourceEventId}-${rel.targetEventId}` ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Accept
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render patterns results
  const renderPatterns = (data: AnalysisResponse) => {
    if (!data.patterns || data.patterns.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Pattern className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No patterns detected.</p>
          <p className="text-sm">AI could not identify significant patterns.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.patterns.map((pattern, index) => (
          <Collapsible
            key={index}
            open={expandedSections.has(`pattern-${index}`)}
            onOpenChange={() => toggleSection(`pattern-${index}`)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{pattern.patternType}</Badge>
                      <CardTitle className="text-sm">{pattern.description}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConfidenceIndicator confidence={pattern.confidence} />
                      {expandedSections.has(`pattern-${index}`) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4">
                  <p className="text-sm text-muted-foreground mb-3">{pattern.details}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground mr-2">Affected Events:</span>
                    {pattern.affectedEvents.slice(0, 5).map((eventId) => (
                      <Badge
                        key={eventId}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => onEventSelect?.(eventId)}
                      >
                        {eventId.slice(0, 8)}...
                      </Badge>
                    ))}
                    {pattern.affectedEvents.length > 5 && (
                      <Badge variant="outline">+{pattern.affectedEvents.length - 5} more</Badge>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    );
  };

  // Render anomalies results
  const renderAnomalies = (data: AnalysisResponse) => {
    if (!data.anomalies || data.anomalies.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No anomalies detected.</p>
          <p className="text-sm">All events appear to follow expected patterns.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.anomalies.map((anomaly, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{anomaly.anomalyType}</Badge>
                    <Badge
                      className={cn(
                        SEVERITY_COLORS[anomaly.severity].bg,
                        SEVERITY_COLORS[anomaly.severity].text,
                        SEVERITY_COLORS[anomaly.severity].border,
                        'border'
                      )}
                    >
                      {anomaly.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{anomaly.description}</p>
                  <p className="text-xs text-muted-foreground mb-2">{anomaly.details}</p>
                  <div
                    className="text-xs text-primary cursor-pointer hover:underline"
                    onClick={() => onEventSelect?.(anomaly.eventId)}
                  >
                    Event: {anomaly.eventTitle}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render summary results
  const renderSummary = (data: AnalysisResponse) => {
    if (!data.summary) return null;

    const { summary } = data;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{summary.overview}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{summary.totalEvents}</div>
              <div className="text-xs text-muted-foreground">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{summary.totalRelationships}</div>
              <div className="text-xs text-muted-foreground">Connections</div>
            </CardContent>
          </Card>
        </div>

        {summary.timeline.earliest && (
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Timeline</div>
              <div className="text-sm">
                {summary.timeline.earliest} → {summary.timeline.latest}
              </div>
            </CardContent>
          </Card>
        )}

        {summary.keyFindings.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Key Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {summary.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Event Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.eventTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render results based on analysis type
  const renderResults = (data: AnalysisResponse) => {
    switch (data.analysisType) {
      case 'relationships':
        return renderRelationships(data);
      case 'patterns':
        return renderPatterns(data);
      case 'anomalies':
        return renderAnomalies(data);
      case 'summary':
        return renderSummary(data);
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Analysis</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          AI-powered investigation insights
        </p>
      </div>

      {/* Analysis Buttons */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-2">
          {ANALYSIS_TYPES.map((analysis) => {
            const hasResults = analysisResults.has(analysis.type);
            const isActive = activeAnalysis === analysis.type;

            return (
              <Button
                key={analysis.type}
                variant={hasResults ? 'default' : 'outline'}
                size="sm"
                className="justify-start h-auto py-2 px-3"
                onClick={() => runAnalysis(analysis.type)}
                disabled={isLoading}
              >
                <span className={cn('mr-2', analysis.color)}>
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    analysis.icon
                  )}
                </span>
                <div className="text-left">
                  <div className="font-medium">{analysis.label}</div>
                  <div className="text-xs opacity-70 truncate">{analysis.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {analysisResults.size === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No Analysis Yet</p>
              <p className="text-sm mt-1">Select an analysis type to begin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(analysisResults.entries()).map(([type, data]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {ANALYSIS_TYPES.find((a) => a.type === type)?.icon}
                      <span className="font-medium capitalize">{type} Analysis</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => runAnalysis(type)}
                      disabled={isLoading && activeAnalysis === type}
                    >
                      <RefreshCw
                        className={cn(
                          'h-3 w-3',
                          isLoading && activeAnalysis === type && 'animate-spin'
                        )}
                      />
                    </Button>
                  </div>
                  {renderResults(data)}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Relationship</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this relationship?
            </DialogDescription>
          </DialogHeader>
          {selectedRelationship && (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 p-2 rounded bg-muted">
                  <p className="text-sm font-medium truncate">
                    {selectedRelationship.sourceEventTitle}
                  </p>
                </div>
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 p-2 rounded bg-muted">
                  <p className="text-sm font-medium truncate">
                    {selectedRelationship.targetEventTitle}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{selectedRelationship.relationType}</Badge>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAcceptRelationship}>
              <Check className="h-4 w-4 mr-2" />
              Create Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
