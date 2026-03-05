import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-utils';
import { getAuthUser, hasProjectAccess } from '@/lib/auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Analysis types
type AnalysisType = 'relationships' | 'patterns' | 'anomalies' | 'summary';

// Types for analysis results
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

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await getAuthUser();
    if (authError || !user) {
      return apiUnauthorized(authError || 'Authentication required');
    }

    // Parse request body
    const body = await request.json();
    const { projectId, analysisType } = body as {
      projectId: string;
      analysisType: AnalysisType;
    };

    // Validate inputs
    if (!projectId) {
      return apiError('Project ID is required');
    }

    if (!['relationships', 'patterns', 'anomalies', 'summary'].includes(analysisType)) {
      return apiError('Invalid analysis type. Must be one of: relationships, patterns, anomalies, summary');
    }

    // Check project access
    const access = await hasProjectAccess(user.id, projectId, 'VIEWER');
    if (!access.hasAccess) {
      return apiError(access.error || 'Access denied to this project', 403);
    }

    // Fetch project data
    const [project, events, relationships] = await Promise.all([
      db.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
        },
      }),
      db.event.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          description: true,
          eventDate: true,
          eventTime: true,
          location: true,
          eventType: true,
          status: true,
          confidence: true,
          importance: true,
          verified: true,
          source: true,
        },
      }),
      db.relationship.findMany({
        where: { projectId },
        select: {
          id: true,
          sourceEventId: true,
          targetEventId: true,
          relationType: true,
          strength: true,
          confidence: true,
          description: true,
        },
      }),
    ]);

    if (!project) {
      return apiError('Project not found', 404);
    }

    // Initialize AI SDK
    const zai = await ZAI.create();

    // Perform analysis based on type
    let analysisResult: AnalysisResponse = {
      analysisType,
      projectId,
      timestamp: new Date().toISOString(),
    };

    switch (analysisType) {
      case 'relationships':
        analysisResult.relationships = await analyzeRelationships(zai, events, relationships);
        break;
      case 'patterns':
        analysisResult.patterns = await analyzePatterns(zai, events, relationships);
        break;
      case 'anomalies':
        analysisResult.anomalies = await analyzeAnomalies(zai, events, relationships);
        break;
      case 'summary':
        analysisResult.summary = await analyzeSummary(zai, project, events, relationships);
        break;
    }

    return apiSuccess(analysisResult);
  } catch (error) {
    console.error('AI Analysis error:', error);
    return apiError(
      error instanceof Error ? error.message : 'An error occurred during analysis',
      500
    );
  }
}

// Analyze potential relationships between events
async function analyzeRelationships(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    eventDate: Date | null;
    eventTime: string | null;
    location: string | null;
    eventType: string;
    status: string;
    confidence: number;
    importance: number;
    verified: boolean;
    source: string | null;
  }>,
  existingRelationships: Array<{
    id: string;
    sourceEventId: string;
    targetEventId: string;
    relationType: string;
    strength: number;
    confidence: number;
    description: string | null;
  }>
): Promise<SuggestedRelationship[]> {
  if (events.length < 2) {
    return [];
  }

  // Create a set of existing relationship pairs
  const existingPairs = new Set<string>();
  existingRelationships.forEach((r) => {
    existingPairs.add(`${r.sourceEventId}-${r.targetEventId}`);
    existingPairs.add(`${r.targetEventId}-${r.sourceEventId}`);
  });

  // Prepare event data for AI analysis
  const eventsData = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || '',
    date: e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : null,
    time: e.eventTime,
    location: e.location,
    type: e.eventType,
    status: e.status,
    confidence: e.confidence,
    importance: e.importance,
    verified: e.verified,
    source: e.source,
  }));

  const prompt = `You are an expert intelligence analyst. Analyze the following events and suggest potential relationships between them that are NOT already connected.

Events:
${JSON.stringify(eventsData, null, 2)}

Existing relationships (already connected pairs):
${Array.from(existingPairs).join(', ')}

Analyze these events and suggest potential relationships. Consider:
1. Temporal proximity (events happening around the same time)
2. Location overlap or proximity
3. Shared entities mentioned in descriptions
4. Complementary event types (e.g., SUSPECT + LOCATION, WITNESS + INCIDENT)
5. Source correlation

Return a JSON array of suggested relationships with this exact format:
[
  {
    "sourceEventId": "id of source event",
    "targetEventId": "id of target event",
    "relationType": "RELATED|TIMELINE|CAUSAL|SUSPECT|WITNESS|LOCATION|COMMUNICATION|FINANCIAL|FAMILY|ASSOCIATE|ORGANIZATION",
    "confidence": 0-100,
    "reasoning": "Brief explanation of why this relationship is suggested"
  }
]

Only suggest relationships that don't already exist. Maximum 10 suggestions. Return only the JSON array, no other text.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. You always respond with valid JSON arrays and nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return [];
    }

    // Parse the JSON response
    const suggestions = JSON.parse(responseContent) as Array<{
      sourceEventId: string;
      targetEventId: string;
      relationType: string;
      confidence: number;
      reasoning: string;
    }>;

    // Validate and enrich suggestions with event titles
    const validSuggestions: SuggestedRelationship[] = [];
    const eventMap = new Map(events.map((e) => [e.id, e]));

    for (const suggestion of suggestions) {
      const sourceEvent = eventMap.get(suggestion.sourceEventId);
      const targetEvent = eventMap.get(suggestion.targetEventId);

      if (
        sourceEvent &&
        targetEvent &&
        !existingPairs.has(`${suggestion.sourceEventId}-${suggestion.targetEventId}`)
      ) {
        validSuggestions.push({
          sourceEventId: suggestion.sourceEventId,
          sourceEventTitle: sourceEvent.title,
          targetEventId: suggestion.targetEventId,
          targetEventTitle: targetEvent.title,
          relationType: suggestion.relationType,
          confidence: Math.min(100, Math.max(0, suggestion.confidence)),
          reasoning: suggestion.reasoning,
        });
      }
    }

    return validSuggestions.slice(0, 10);
  } catch (error) {
    console.error('Error analyzing relationships:', error);
    return [];
  }
}

// Analyze patterns in events
async function analyzePatterns(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    eventDate: Date | null;
    eventTime: string | null;
    location: string | null;
    eventType: string;
    status: string;
    confidence: number;
    importance: number;
    verified: boolean;
    source: string | null;
  }>,
  relationships: Array<{
    id: string;
    sourceEventId: string;
    targetEventId: string;
    relationType: string;
    strength: number;
    confidence: number;
    description: string | null;
  }>
): Promise<PatternResult[]> {
  if (events.length < 3) {
    return [];
  }

  const eventsData = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || '',
    date: e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : null,
    time: e.eventTime,
    location: e.location,
    type: e.eventType,
    status: e.status,
    confidence: e.confidence,
  }));

  const relationshipsData = relationships.map((r) => ({
    source: r.sourceEventId,
    target: r.targetEventId,
    type: r.relationType,
    strength: r.strength,
  }));

  const prompt = `You are an expert intelligence analyst. Analyze the following events and relationships to identify patterns.

Events:
${JSON.stringify(eventsData, null, 2)}

Relationships:
${JSON.stringify(relationshipsData, null, 2)}

Look for patterns such as:
1. Temporal patterns (events occurring in sequences or cycles)
2. Geographic patterns (clusters of activity in locations)
3. Network patterns (central hubs, isolated clusters)
4. Behavioral patterns (similar modus operandi)
5. Status progression patterns
6. Confidence/importance correlations

Return a JSON array of detected patterns with this exact format:
[
  {
    "patternType": "TEMPORAL|GEOGRAPHIC|NETWORK|BEHAVIORAL|STATUS|CONFIDENCE|CUSTOM",
    "description": "Brief description of the pattern",
    "affectedEvents": ["event ids involved"],
    "confidence": 0-100,
    "details": "Detailed explanation with specific observations"
  }
]

Maximum 5 patterns. Return only the JSON array, no other text.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. You always respond with valid JSON arrays and nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return [];
    }

    const patterns = JSON.parse(responseContent) as Array<{
      patternType: string;
      description: string;
      affectedEvents: string[];
      confidence: number;
      details: string;
    }>;

    // Validate patterns
    const eventIds = new Set(events.map((e) => e.id));
    return patterns
      .filter((p) => p.affectedEvents.every((id) => eventIds.has(id)))
      .slice(0, 5)
      .map((p) => ({
        ...p,
        confidence: Math.min(100, Math.max(0, p.confidence)),
      }));
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    return [];
  }
}

// Analyze anomalies in events
async function analyzeAnomalies(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    eventDate: Date | null;
    eventTime: string | null;
    location: string | null;
    eventType: string;
    status: string;
    confidence: number;
    importance: number;
    verified: boolean;
    source: string | null;
  }>,
  relationships: Array<{
    id: string;
    sourceEventId: string;
    targetEventId: string;
    relationType: string;
    strength: number;
    confidence: number;
    description: string | null;
  }>
): Promise<AnomalyResult[]> {
  if (events.length < 2) {
    return [];
  }

  // Calculate statistics for anomaly detection
  const avgConfidence =
    events.reduce((sum, e) => sum + e.confidence, 0) / events.length;
  const avgImportance =
    events.reduce((sum, e) => sum + e.importance, 0) / events.length;

  // Find isolated events (no relationships)
  const connectedEventIds = new Set<string>();
  relationships.forEach((r) => {
    connectedEventIds.add(r.sourceEventId);
    connectedEventIds.add(r.targetEventId);
  });

  const eventsData = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || '',
    date: e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : null,
    time: e.eventTime,
    location: e.location,
    type: e.eventType,
    status: e.status,
    confidence: e.confidence,
    importance: e.importance,
    verified: e.verified,
    isConnected: connectedEventIds.has(e.id),
    isHighConfidence: e.confidence > avgConfidence + 20,
    isLowConfidence: e.confidence < avgConfidence - 20,
    isHighImportance: e.importance > avgImportance + 20,
  }));

  const prompt = `You are an expert intelligence analyst. Analyze the following events for anomalies or outliers that may require attention.

Events (with anomaly indicators):
${JSON.stringify(eventsData, null, 2)}

Average confidence: ${avgConfidence.toFixed(1)}
Average importance: ${avgImportance.toFixed(1)}

Look for anomalies such as:
1. Isolated events with no connections (may need investigation)
2. High importance events with low confidence (needs verification)
3. Unverified events that are central to the investigation
4. Disputed events that should be reviewed
5. Events with unusual combinations of attributes
6. Events that deviate significantly from patterns

Return a JSON array of detected anomalies with this exact format:
[
  {
    "anomalyType": "ISOLATED|LOW_CONFIDENCE_HIGH_IMPORTANCE|UNVERIFIED_CRITICAL|DISPUTED|ATTRIBUTE_UNUSUAL|DEVIATION",
    "description": "Brief description of the anomaly",
    "eventId": "id of the anomalous event",
    "severity": "low|medium|high",
    "details": "Detailed explanation of why this is anomalous"
  }
]

Maximum 10 anomalies. Return only the JSON array, no other text.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. You always respond with valid JSON arrays and nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return [];
    }

    const anomalies = JSON.parse(responseContent) as Array<{
      anomalyType: string;
      description: string;
      eventId: string;
      severity: 'low' | 'medium' | 'high';
      details: string;
    }>;

    // Validate and enrich anomalies with event titles
    const eventMap = new Map(events.map((e) => [e.id, e]));
    return anomalies
      .filter((a) => eventMap.has(a.eventId))
      .slice(0, 10)
      .map((a) => ({
        ...a,
        eventTitle: eventMap.get(a.eventId)?.title || '',
      }));
  } catch (error) {
    console.error('Error analyzing anomalies:', error);
    return [];
  }
}

// Generate summary of the investigation
async function analyzeSummary(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  project: { id: string; name: string; description: string | null; status: string },
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    eventDate: Date | null;
    eventTime: string | null;
    location: string | null;
    eventType: string;
    status: string;
    confidence: number;
    importance: number;
    verified: boolean;
    source: string | null;
  }>,
  relationships: Array<{
    id: string;
    sourceEventId: string;
    targetEventId: string;
    relationType: string;
    strength: number;
    confidence: number;
    description: string | null;
  }>
): Promise<SummaryResult> {
  // Calculate basic statistics
  const eventTypes: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {};

  events.forEach((e) => {
    eventTypes[e.eventType] = (eventTypes[e.eventType] || 0) + 1;
    statusDistribution[e.status] = (statusDistribution[e.status] || 0) + 1;
  });

  // Find date range
  const dates = events
    .map((e) => e.eventDate)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const timeline: { earliest?: string; latest?: string } = {};
  if (dates.length > 0) {
    timeline.earliest = dates[0].toISOString().split('T')[0];
    timeline.latest = dates[dates.length - 1].toISOString().split('T')[0];
  }

  const eventsData = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || '',
    date: e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : null,
    type: e.eventType,
    status: e.status,
    confidence: e.confidence,
    importance: e.importance,
    verified: e.verified,
  }));

  const prompt = `You are an expert intelligence analyst. Generate a comprehensive summary of this investigation.

Project: ${project.name}
Description: ${project.description || 'No description'}
Status: ${project.status}

Events (${events.length} total):
${JSON.stringify(eventsData, null, 2)}

Relationships (${relationships.length} total):
${JSON.stringify(
  relationships.map((r) => ({
    type: r.relationType,
    strength: r.strength,
  })),
  null,
  2
)}

Statistics:
- Event Types: ${JSON.stringify(eventTypes)}
- Status Distribution: ${JSON.stringify(statusDistribution)}
- Timeline: ${timeline.earliest || 'Unknown'} to ${timeline.latest || 'Unknown'}

Generate a summary with this exact JSON format:
{
  "overview": "A 2-3 sentence overview of the investigation",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Return only the JSON object, no other text.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. You always respond with valid JSON and nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return {
        overview: 'Unable to generate summary.',
        totalEvents: events.length,
        totalRelationships: relationships.length,
        keyFindings: [],
        recommendations: [],
        timeline,
        eventTypes,
        statusDistribution,
      };
    }

    const summary = JSON.parse(responseContent) as {
      overview: string;
      keyFindings: string[];
      recommendations: string[];
    };

    return {
      overview: summary.overview,
      totalEvents: events.length,
      totalRelationships: relationships.length,
      keyFindings: summary.keyFindings.slice(0, 5),
      recommendations: summary.recommendations.slice(0, 5),
      timeline,
      eventTypes,
      statusDistribution,
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      overview: 'Unable to generate AI summary due to an error.',
      totalEvents: events.length,
      totalRelationships: relationships.length,
      keyFindings: [],
      recommendations: [],
      timeline,
      eventTypes,
      statusDistribution,
    };
  }
}
