# Dataset Integration Plan

## Overview
Integrate GitHub-hosted moderation datasets to improve content warning accuracy and coverage.

## Current State
- **Training Examples**: `lib/training-examples.ts` contains ~20 book examples
- **Approach**: Prompt-based with Publications Guidelines methodology
- **Models**: OpenAI GPT-4o + Gemini 2.0 Flash
- **Taxonomy**: Custom taxonomy aligned with Australian Classification Board

## Strategy: Two-Pronged Approach

### 1. Example Augmentation (Immediate)
**Goal**: Expand `training-examples.ts` with edge cases from moderation datasets

**Process**:
1. Download/parse moderation datasets
2. Map their taxonomies to ours (e.g., "toxic" → our categories)
3. Convert to book-description format (synthetic or adapted)
4. Add to training examples with proper severity/context

**Benefits**:
- No infrastructure changes needed
- Can be done incrementally
- Improves few-shot learning in prompts
- Maintains current architecture

### 2. Database Expansion (Medium-term)
**Goal**: Store moderation patterns in database for reference/validation

**Process**:
1. Create `moderation_patterns` table
2. Store patterns with:
   - Original text/pattern
   - Mapped categories
   - Severity level
   - Context modifiers
   - Source dataset
3. Use for:
   - Validation during analysis
   - Edge case detection
   - Pattern matching

## Dataset Mapping Strategy

### Toxicity Datasets → Our Categories

| Dataset Category | Our Category | Notes |
|-----------------|--------------|-------|
| `toxic` | `language.strong_language` | Coarse language |
| `severe_toxic` | `violence` or `abuse` | More severe |
| `threat` | `violence.threats` | Direct threats |
| `insult` | `discrimination` or `abuse` | Depends on context |
| `identity_hate` | `discrimination` | Clear mapping |
| `obscene` | `sexual_content` | Sexual content |

### Hate Speech → Our Categories

| Dataset Category | Our Category | Notes |
|-----------------|--------------|-------|
| Hate speech | `discrimination` | Various forms |
| Misinformation | `other` | May need new category |
| Self-harm | `mental_health.self_harm` | Direct mapping |
| Sexual content | `sexual_content` | Various subcategories |

## Priority Datasets

### High Priority (Easy to integrate)
1. **Surge AI Toxicity** (`surge-ai/toxicity`)
   - Small (1,000 examples)
   - Clean binary labels
   - Good for testing

2. **OpenAI Moderation Examples** (`openai/moderation-api-release`)
   - Aligned with safety categories
   - Well-documented
   - Similar taxonomy structure

### Medium Priority (Requires more mapping)
3. **ToxiGen (Microsoft)** (`microsoft/TOXIGEN`)
   - Large corpus
   - Implicit toxicity (harder cases)
   - Good for edge cases

4. **Socio-Culturally Aware Dataset** (`gaurikholkar/...`)
   - Multi-label categories
   - Diversity-focused
   - Good for discrimination patterns

### Lower Priority (Different domain)
5. **Civil Comments / Jigsaw**
   - Social media focused
   - May not translate well to books
   - But good for language patterns

## Implementation Steps

### Phase 1: Dataset Explorer Script
- [ ] Create script to download/explore datasets
- [ ] Parse different formats (CSV, JSON, etc.)
- [ ] Display sample mappings
- [ ] Test taxonomy mapping

### Phase 2: Example Converter
- [ ] Convert dataset examples to book-description format
- [ ] Map categories to our taxonomy
- [ ] Assign severity levels
- [ ] Add context modifiers where applicable

### Phase 3: Integration
- [ ] Add converted examples to `training-examples.ts`
- [ ] Test with existing analysis pipeline
- [ ] Measure improvement

### Phase 4: Database Storage (Optional)
- [ ] Create `moderation_patterns` table
- [ ] Import patterns
- [ ] Create validation/pattern matching functions

## Challenges & Solutions

### Challenge 1: Domain Mismatch
**Problem**: Moderation datasets are social media comments, not book descriptions

**Solution**: 
- Adapt examples to book context
- Use as pattern examples, not direct text
- Focus on category/severity mapping

### Challenge 2: Taxonomy Differences
**Problem**: Datasets use different category systems

**Solution**:
- Create mapping tables
- Manual review of edge cases
- Use AI to suggest mappings

### Challenge 3: Context Loss
**Problem**: Short social media comments lack book context

**Solution**:
- Synthesize book descriptions from patterns
- Focus on category detection, not full analysis
- Use as validation examples

## Success Metrics

1. **Coverage**: More edge cases handled correctly
2. **Accuracy**: Improved severity assessment
3. **Consistency**: More consistent across similar content
4. **Edge Cases**: Better handling of implicit toxicity/hate

## Next Steps

1. Create dataset explorer script
2. Test with Surge AI Toxicity dataset (small, clean)
3. Evaluate improvement
4. Scale to larger datasets


