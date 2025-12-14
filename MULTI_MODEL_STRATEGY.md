# Multi-Model Strategy: Supporting Multiple AI Providers

## Current Architecture

**Current Stack:**
- `@openai/agents` - OpenAI-specific agent framework
- GPT-4o as default model
- Tool calling for web search and structured output

**Challenge:** Tightly coupled to OpenAI's agent framework

---

## Why Consider Other Models?

### 1. **Cost Optimization**
- **Gemini 2.0 Flash**: ~50% cheaper than GPT-4o, similar quality
- **Claude Sonnet 4.5**: Similar cost, potentially better reasoning
- **GPT-4 Turbo**: Faster, slightly cheaper than GPT-4o

### 2. **Performance**
- **Speed**: Some models are faster (Gemini Flash, GPT-4 Turbo)
- **Rate Limits**: Different providers = different rate limits
- **Reliability**: Redundancy if one provider is down

### 3. **Quality Comparison**
- **Claude**: Excellent reasoning, good for complex analysis
- **Gemini**: Fast, good tool use, competitive quality
- **GPT-4o**: Current baseline, excellent quality

### 4. **Vendor Lock-in**
- Reduce dependency on single provider
- Better negotiation position
- Risk mitigation

---

## Implementation Options

### Option 1: Multi-Provider Abstraction Layer ⭐ **RECOMMENDED**

Create an abstraction that supports multiple providers while keeping the same interface.

**Architecture:**
```
lib/
  ai/
    providers/
      openai-agent.ts      # Current OpenAI implementation
      anthropic-agent.ts   # Claude implementation
      google-agent.ts      # Gemini implementation
      base-agent.ts        # Abstract interface
    agent-factory.ts       # Factory to create agents
```

**Benefits:**
- ✅ Keep existing code mostly intact
- ✅ Easy to add new providers
- ✅ Can A/B test different models
- ✅ Fallback if one provider fails

**Implementation Complexity:** Medium (2-3 days)

---

### Option 2: Use Vercel AI SDK (Multi-Provider)

Vercel AI SDK supports multiple providers with unified interface.

**Pros:**
- ✅ Built-in support for OpenAI, Anthropic, Google
- ✅ Unified streaming interface
- ✅ Tool calling support
- ✅ Well-maintained

**Cons:**
- ❌ Need to refactor existing `@openai/agents` code
- ❌ Different API than current implementation
- ❌ May lose some OpenAI-specific features

**Implementation Complexity:** High (5-7 days)

---

### Option 3: LangChain (Multi-Provider Framework)

LangChain provides abstraction for multiple LLM providers.

**Pros:**
- ✅ Excellent tool calling support
- ✅ Many providers supported
- ✅ Good documentation

**Cons:**
- ❌ Large dependency
- ❌ Different paradigm (chains vs agents)
- ❌ More complex setup

**Implementation Complexity:** High (7-10 days)

---

### Option 4: Direct API Calls with Abstraction

Create a simple abstraction layer over direct API calls.

**Pros:**
- ✅ Lightweight
- ✅ Full control
- ✅ No framework overhead

**Cons:**
- ❌ Need to implement tool calling yourself
- ❌ More code to maintain
- ❌ Need to handle streaming, errors, etc.

**Implementation Complexity:** Medium-High (4-6 days)

---

## Recommended Approach: Option 1 (Abstraction Layer)

### Phase 1: Create Base Interface

```typescript
// lib/ai/base-agent.ts
export interface AIAgent {
  name: string
  model: string
  
  run(input: string, tools: Tool[], instructions: string): Promise<AgentResult>
}

export interface AgentResult {
  success: boolean
  output?: any
  reasoning?: string
  confidence?: 'low' | 'medium' | 'high'
  error?: string
}
```

### Phase 2: Implement OpenAI Provider (Wrap Existing)

```typescript
// lib/ai/providers/openai-agent.ts
import { Agent, run, tool } from "@openai/agents"
import { AIAgent, AgentResult } from "../base-agent"

export class OpenAIAgent implements AIAgent {
  constructor(public model: string) {}
  
  async run(input: string, tools: Tool[], instructions: string): Promise<AgentResult> {
    // Wrap existing OpenAI agent code
    const agent = new Agent({
      model: this.model,
      instructions,
      tools: tools.map(convertToOpenAITool)
    })
    
    const result = await run(agent, input)
    return convertToAgentResult(result)
  }
}
```

### Phase 3: Implement Other Providers

```typescript
// lib/ai/providers/anthropic-agent.ts
import { Anthropic } from "@anthropic-ai/sdk"
import { AIAgent } from "../base-agent"

export class AnthropicAgent implements AIAgent {
  private client: Anthropic
  
  async run(input: string, tools: Tool[], instructions: string): Promise<AgentResult> {
    // Implement Claude API calls with tool use
  }
}
```

### Phase 4: Factory Pattern

```typescript
// lib/ai/agent-factory.ts
export function createAgent(provider: 'openai' | 'anthropic' | 'google', model: string): AIAgent {
  switch (provider) {
    case 'openai':
      return new OpenAIAgent(model)
    case 'anthropic':
      return new AnthropicAgent(model)
    case 'google':
      return new GoogleAgent(model)
  }
}
```

### Phase 5: Update Content Warning Agent

```typescript
// lib/content-warning-agent.ts
import { createAgent } from './ai/agent-factory'

export const generateContentWarnings = async (
  workflow: WorkflowInput,
  provider: 'openai' | 'anthropic' | 'google' = 'openai',
  model: string = 'gpt-4o',
  instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid'
) => {
  const agent = createAgent(provider, model)
  // Use agent.run() instead of OpenAI-specific code
}
```

---

## Model Recommendations

### For Production (Current)
- **Primary**: GPT-4o (current)
- **Why**: Proven quality, good tool use, reliable

### For Testing/Comparison
1. **Claude Sonnet 4.5**
   - Best reasoning quality
   - Excellent for complex analysis
   - Similar cost to GPT-4o

2. **Gemini 2.0 Flash**
   - Fastest option
   - ~50% cheaper
   - Good quality for most cases

3. **GPT-4 Turbo**
   - Faster than GPT-4o
   - Similar quality
   - Same provider (easy migration)

### Cost Comparison (Approximate)

| Model | Input Cost | Output Cost | Speed | Quality |
|-------|-----------|-------------|-------|---------|
| GPT-4o | $2.50/1M | $10/1M | Medium | ⭐⭐⭐⭐⭐ |
| GPT-4 Turbo | $10/1M | $30/1M | Fast | ⭐⭐⭐⭐⭐ |
| Claude Sonnet 4.5 | $3/1M | $15/1M | Medium | ⭐⭐⭐⭐⭐ |
| Gemini 2.0 Flash | $0.075/1M | $0.30/1M | Very Fast | ⭐⭐⭐⭐ |
| GPT-3.5 Turbo | $0.50/1M | $1.50/1M | Fast | ⭐⭐⭐ |

*Note: Costs vary, check current pricing*

---

## Testing Strategy

### 1. Quality Comparison
Use the existing agent comparison tool to test:
- Warning accuracy
- False positive/negative rates
- Reasoning quality
- Confidence calibration

### 2. Performance Testing
- Speed (total time, AI generation time)
- Rate limit handling
- Error rates
- Cost per scan

### 3. A/B Testing
- Route X% of scans to alternative model
- Compare results
- Monitor user feedback

---

## Migration Path

### Step 1: Create Abstraction (Week 1)
- Define base interface
- Wrap existing OpenAI code
- Test that nothing breaks

### Step 2: Add One Provider (Week 2)
- Implement Gemini or Claude
- Test with comparison tool
- Compare quality/speed/cost

### Step 3: Add Model Selection (Week 3)
- Add provider selection to API
- Add to dev comparison tool
- Test in production (small %)

### Step 4: Optimize (Week 4)
- Choose best model per use case
- Implement fallback logic
- Monitor and iterate

---

## Quick Wins

### 1. Test GPT-4 Turbo First
- Same provider (OpenAI)
- Minimal code changes
- Just change model name
- Likely faster/cheaper

### 2. Add Model Parameter to API
```typescript
// Already partially done - just need to support more models
POST /api/scan-isbn
{
  "isbn": "...",
  "model": "gpt-4-turbo" | "gpt-4o" | "gpt-4o-mini"
}
```

### 3. Use Gemini for Simple Cases
- If metadata is good, use faster/cheaper model
- If metadata is thin, use GPT-4o
- Smart routing based on complexity

---

## Questions to Answer

1. **What's the priority?**
   - Cost reduction → Gemini Flash
   - Quality improvement → Claude Sonnet 4.5
   - Speed → GPT-4 Turbo or Gemini Flash

2. **What's the budget?**
   - Current costs?
   - Target reduction?
   - Willing to pay more for quality?

3. **What's the risk tolerance?**
   - Can we test in production?
   - Need fallback?
   - How to handle failures?

---

## Next Steps

1. **Immediate**: Test GPT-4 Turbo (easy, same provider)
2. **Short-term**: Implement abstraction layer
3. **Medium-term**: Add Gemini/Claude support
4. **Long-term**: Smart routing based on book complexity

---

## Resources

- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Anthropic API](https://docs.anthropic.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [LangChain](https://js.langchain.com/)

---

**Recommendation**: Start with GPT-4 Turbo testing (easy win), then implement abstraction layer to enable multi-provider support for future flexibility.











