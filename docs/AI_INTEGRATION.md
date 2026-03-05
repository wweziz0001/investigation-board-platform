# AI Integration | تكامل الذكاء الاصطناعي

## Overview | نظرة عامة

The Intelligence Investigation Platform includes AI-powered analysis capabilities using the z-ai-web-dev-sdk. This enables intelligent relationship detection, pattern recognition, anomaly detection, and investigation summaries.

---

## Capabilities | القدرات

### 1. Relationship Detection | اكتشاف العلاقات

Automatically detect potential relationships between entities based on:
- Temporal proximity
- Location overlap
- Shared entities
- Complementary event types

### 2. Pattern Recognition | التعرف على الأنماط

Identify patterns in investigation data:
- Temporal patterns (time-based clusters)
- Geographic patterns (location clusters)
- Network patterns (connection clusters)
- Behavioral patterns (action sequences)
- Status progression patterns

### 3. Anomaly Detection | اكتشاف الحالات الشاذة

Find unusual elements:
- Isolated events (no connections)
- Confidence/importance mismatches
- Unverified critical events
- Unusual attribute combinations

### 4. Investigation Summary | ملخص التحقيق

Generate comprehensive summaries:
- Overview of investigation
- Key statistics
- Timeline highlights
- Key findings
- Recommendations

---

## API Usage | استخدام واجهة البرمجة

### Endpoint

```
POST /api/ai/analyze
```

### Request Format

```json
{
  "projectId": "project-uuid",
  "analysisType": "relationships"
}
```

### Analysis Types

| Type | Description |
|------|-------------|
| `relationships` | Detect potential relationships |
| `patterns` | Identify patterns in data |
| `anomalies` | Find anomalies and outliers |
| `summary` | Generate investigation summary |

### Response Format

#### Relationships Analysis

```json
{
  "success": true,
  "data": {
    "type": "relationships",
    "suggestions": [
      {
        "sourceId": "event-1-uuid",
        "targetId": "event-2-uuid",
        "relationType": "COMMUNICATION",
        "label": "Potential connection",
        "confidence": 0.85,
        "reasoning": "Both events occurred at similar location within 24 hours..."
      }
    ],
    "analyzedAt": "2025-01-01T00:00:00Z",
    "eventCount": 50,
    "relationshipCount": 25
  }
}
```

#### Patterns Analysis

```json
{
  "success": true,
  "data": {
    "type": "patterns",
    "patterns": [
      {
        "type": "temporal",
        "description": "Multiple events on same day",
        "events": ["event-1", "event-2", "event-3"],
        "significance": 0.75
      }
    ]
  }
}
```

#### Anomalies Analysis

```json
{
  "success": true,
  "data": {
    "type": "anomalies",
    "anomalies": [
      {
        "type": "isolated_event",
        "eventId": "event-uuid",
        "severity": "medium",
        "description": "Event has no connections",
        "suggestion": "Consider investigating potential relationships"
      }
    ]
  }
}
```

#### Summary Analysis

```json
{
  "success": true,
  "data": {
    "type": "summary",
    "summary": {
      "overview": "Investigation overview text...",
      "statistics": {
        "totalEvents": 50,
        "totalRelationships": 25,
        "verifiedEvents": 30,
        "eventTypes": {...}
      },
      "timeline": [...],
      "keyFindings": [...],
      "recommendations": [...]
    }
  }
}
```

---

## Frontend Integration | تكامل الواجهة

### AIAnalysisPanel Component

```tsx
import { AIAnalysisPanel } from '@/components/board/ai-analysis-panel';

function ProjectPage() {
  const handleAcceptRelationship = async (rel) => {
    // Create the relationship
    await createRelationship(rel);
  };

  return (
    <AIAnalysisPanel
      projectId={projectId}
      onAcceptRelationship={handleAcceptRelationship}
      onEventSelect={(eventId) => {
        // Handle event selection
      }}
    />
  );
}
```

### Component Props

```typescript
interface AIAnalysisPanelProps {
  projectId: string;
  onAcceptRelationship?: (relationship: SuggestedRelationship) => Promise<void>;
  onEventSelect?: (eventId: string) => void;
  compact?: boolean; // For sidebar display
}
```

---

## SDK Integration | تكامل SDK

### Server-Side Usage

```typescript
// In API route
import { createLLM } from 'z-ai-web-dev-sdk';

export async function POST(request: Request) {
  const llm = createLLM();
  
  const response = await llm.chat({
    messages: [
      {
        role: 'system',
        content: 'You are an investigation analyst AI...'
      },
      {
        role: 'user',
        content: 'Analyze these events for relationships...'
      }
    ]
  });
  
  return Response.json({
    success: true,
    data: response
  });
}
```

### Available SDK Functions

| Function | Description |
|----------|-------------|
| `createLLM()` | Create LLM instance for text generation |
| `createVLM()` | Create VLM instance for image analysis |
| `createTTS()` | Create TTS instance for text-to-speech |
| `createASR()` | Create ASR instance for speech-to-text |

---

## Custom Analysis | تحليل مخصص

### Creating Custom Analysis

```typescript
// Custom analysis function
async function customAnalysis(events: Event[], relationships: Relationship[]) {
  const llm = createLLM();
  
  const prompt = `
    Analyze the following investigation data and provide insights:
    
    Events: ${JSON.stringify(events)}
    Relationships: ${JSON.stringify(relationships)}
    
    Focus on:
    1. Unusual patterns
    2. Missing connections
    3. High-risk entities
  `;
  
  const response = await llm.chat({
    messages: [{ role: 'user', content: prompt }]
  });
  
  return parseAnalysisResponse(response);
}
```

---

## Best Practices | أفضل الممارسات

### 1. Data Preparation

- Clean and validate data before analysis
- Remove duplicates and errors
- Ensure consistent formatting

### 2. Prompt Engineering

```typescript
const effectivePrompt = `
You are an expert intelligence analyst. Analyze the following data:

Context: ${context}
Data: ${JSON.stringify(data)}

Provide:
1. Clear, actionable insights
2. Confidence scores (0-1)
3. Reasoning for each finding

Format your response as JSON.
`;
```

### 3. Response Handling

- Always validate AI responses
- Handle parsing errors gracefully
- Provide fallback behavior

### 4. Performance

- Cache analysis results
- Use pagination for large datasets
- Implement debouncing for frequent requests

---

## Extending AI Features | توسيع ميزات الذكاء الاصطناعي

### Adding New Analysis Types

1. **Define the analysis type**

```typescript
// In API route
const ANALYSIS_TYPES = {
  relationships: analyzeRelationships,
  patterns: analyzePatterns,
  anomalies: analyzeAnomalies,
  summary: generateSummary,
  // Add custom type
  custom: analyzeCustom,
};
```

2. **Implement the analysis function**

```typescript
async function analyzeCustom(data: AnalysisData): Promise<AnalysisResult> {
  const llm = createLLM();
  
  // Custom analysis logic
  const result = await llm.chat({
    messages: [
      { role: 'system', content: 'Custom analysis instructions...' },
      { role: 'user', content: JSON.stringify(data) }
    ]
  });
  
  return parseResult(result);
}
```

3. **Update the UI**

```tsx
<Button onClick={() => runAnalysis('custom')}>
  Run Custom Analysis
</Button>
```

---

## Error Handling | معالجة الأخطاء

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AI_UNAVAILABLE` | SDK not initialized | Check SDK configuration |
| `INVALID_RESPONSE` | Malformed AI response | Implement response validation |
| `TIMEOUT` | Analysis took too long | Reduce data size or increase timeout |
| `RATE_LIMITED` | Too many requests | Implement request throttling |

### Error Handling Example

```typescript
try {
  const result = await runAnalysis(projectId, type);
  return result;
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Show user-friendly message
    toast.error('Analysis is being processed. Please wait...');
  } else {
    toast.error('Analysis failed. Please try again.');
  }
  console.error('Analysis error:', error);
}
```

---

## Future Enhancements | تحسينات مستقبلية

1. **Entity Extraction** - Extract entities from documents
2. **Sentiment Analysis** - Analyze sentiment in communications
3. **Image Analysis** - Analyze images for evidence
4. **Predictive Analysis** - Predict future events
5. **Natural Language Queries** - Query data using natural language
